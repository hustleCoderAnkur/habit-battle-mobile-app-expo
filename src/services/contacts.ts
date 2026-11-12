import * as Contacts from "expo-contacts/legacy";
import { Linking, Platform } from "react-native";

import { matchContacts } from "@/api/users";
import type { ContactMatch } from "@/api/types";
import { APP_LINK } from "@/constants/app";
import { getStoredUsername } from "@/services/session";

/* =========================================================
   TYPES
========================================================= */

export interface DeviceContact {
    id: string;
    name: string;
    emails: string[];
    phones: string[];
}

export interface ContactResult {
    contact: DeviceContact;
    /** registered user for this contact, or null -> invite them */
    user: ContactMatch | null;
}

/* =========================================================
   PERMISSION
========================================================= */

export async function requestContactsAccess(): Promise<{
    granted: boolean;
    canAskAgain: boolean;
}> {
    const current = await Contacts.getPermissionsAsync();
    if (current.status === "granted") return { granted: true, canAskAgain: true };
    if (!current.canAskAgain) return { granted: false, canAskAgain: false };

    const result = await Contacts.requestPermissionsAsync();
    return {
        granted: result.status === "granted",
        canAskAgain: result.canAskAgain,
    };
}

/* =========================================================
   READ CONTACTS FROM THE DEVICE
========================================================= */

export async function loadDeviceContacts(): Promise<DeviceContact[]> {
    const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
        sort: Contacts.SortTypes.FirstName,
    });

    const out: DeviceContact[] = [];

    for (const c of data) {
        const phones = unique(
            (c.phoneNumbers ?? [])
                .map((p) => p.number ?? "")
                .filter((n) => phoneKeyOf(n) !== null)
        );
        const emails = unique(
            (c.emails ?? [])
                .map((e) => (e.email ?? "").trim().toLowerCase())
                .filter((e) => /^\S+@\S+\.\S+$/.test(e))
        );

        const name = (c.name ?? "").trim();
        if (!name || (phones.length === 0 && emails.length === 0)) continue;

        out.push({ id: c.id ?? `${name}-${out.length}`, name, emails, phones });
    }

    return out;
}

/* =========================================================
   PHONE KEY (mirrors the backend: last 10 digits)
========================================================= */

export function phoneKeyOf(raw: string): string | null {
    let digits = raw.replace(/\D/g, "");
    if (digits.startsWith("00")) digits = digits.slice(2);
    if (digits.length < 8 || digits.length > 15) return null;
    return digits.slice(-10);
}

const unique = <T,>(list: T[]) => [...new Set(list)];

/* =========================================================
   MATCH AGAINST THE DATABASE
========================================================= */

const CHUNK = 500;
const MAX_REQUESTS = 5; // backend allows 6 match calls per minute

export async function matchDeviceContacts(
    contacts: DeviceContact[]
): Promise<ContactResult[]> {
    const phones = unique(contacts.flatMap((c) => c.phones));
    const emails = unique(contacts.flatMap((c) => c.emails));

    const calls = Math.min(
        MAX_REQUESTS,
        Math.max(Math.ceil(phones.length / CHUNK), Math.ceil(emails.length / CHUNK), 1)
    );

    const responses: ContactMatch[] = [];
    for (let i = 0; i < calls; i++) {
        const chunk = {
            phones: phones.slice(i * CHUNK, (i + 1) * CHUNK),
            emails: emails.slice(i * CHUNK, (i + 1) * CHUNK),
        };
        if (chunk.phones.length === 0 && chunk.emails.length === 0) continue;
        responses.push(...(await matchContacts(chunk)));
    }

    const byEmail = new Map<string, ContactMatch>();
    const byPhone = new Map<string, ContactMatch>();
    for (const match of responses) {
        match.matchedEmails.forEach((e) => byEmail.set(e, match));
        match.matchedPhoneKeys.forEach((k) => byPhone.set(k, match));
    }

    return contacts.map((contact) => {
        let user: ContactMatch | null = null;

        for (const email of contact.emails) {
            user = byEmail.get(email) ?? user;
        }
        for (const phone of contact.phones) {
            const key = phoneKeyOf(phone);
            if (key) user = byPhone.get(key) ?? user;
        }

        return { contact, user };
    });
}

/* =========================================================
   INVITE (SMS / email) for people not on the app
========================================================= */

export async function inviteMessage(): Promise<string> {
    const username = await getStoredUsername().catch(() => null);

    return [
        "Hey! I'm using Habit Battle to build habits and battle friends.",
        "Join me and let's keep each other accountable 💪",
        username ? `Add me: @${username}` : "",
        APP_LINK,
    ]
        .filter(Boolean)
        .join(" ");
}

/** Opens the SMS app (or mail app) with the message filled in. */
export async function inviteContact(contact: DeviceContact): Promise<boolean> {
    const message = await inviteMessage();
    const body = encodeURIComponent(message);

    const url = contact.phones[0]
        ? `sms:${contact.phones[0].replace(/[^\d+]/g, "")}${Platform.OS === "ios" ? "&" : "?"}body=${body}`
        : contact.emails[0]
          ? `mailto:${contact.emails[0]}?subject=${encodeURIComponent("Join me on Habit Battle")}&body=${body}`
          : null;

    if (!url) return false;

    try {
        await Linking.openURL(url);
        return true;
    } catch {
        return false;
    }
}

/** Invite someone by raw email / phone typed in the search box. */
export async function inviteByValue(
    kind: "email" | "phone",
    value: string
): Promise<boolean> {
    return inviteContact({
        id: value,
        name: value,
        emails: kind === "email" ? [value] : [],
        phones: kind === "phone" ? [value] : [],
    });
}
