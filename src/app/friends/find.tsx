import { Linking } from "react-native";
import { Check, Contact, Mail, Search, Send, UserPlus } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { sendFriendRequest } from "@/api/friendships";
import { lookupUser, searchUsers } from "@/api/users";
import type { PersonMatch, Relationship, UserSearchResult } from "@/api/types";
import {
    Avatar,
    Badge,
    Button,
    Card,
    EmptyState,
    LoadingState,
    Screen,
    ScreenHeader,
    SectionTitle,
    Segmented,
} from "@/components/ui";
import { colors, radius } from "@/constants/theme";
import { getErrorMessage } from "@/services/api";
import {
    ContactResult,
    inviteByValue,
    inviteContact,
    loadDeviceContacts,
    matchDeviceContacts,
    requestContactsAccess,
} from "@/services/contacts";

/* ---------------------------------------------------------
   What did the user type?
--------------------------------------------------------- */

type Query =
    | { kind: "email"; value: string }
    | { kind: "phone"; value: string }
    | { kind: "username"; value: string };

function parseQuery(raw: string): Query | null {
    const value = raw.trim();
    if (!value) return null;

    if (value.includes("@") && /^\S+@\S+\.\S+$/.test(value)) {
        return { kind: "email", value: value.toLowerCase() };
    }

    const digits = value.replace(/\D/g, "");
    if (/^[+\d\s()-]+$/.test(value) && digits.length >= 8) {
        return { kind: "phone", value };
    }

    return { kind: "username", value: value.replace(/^@/, "") };
}

/* ---------------------------------------------------------
   Screen
--------------------------------------------------------- */

type SearchState =
    | { status: "idle" }
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "found"; people: PersonMatch[] }
    | { status: "not-found"; query: Query };

type ContactsState =
    | { status: "idle" }
    | { status: "loading"; label: string }
    | { status: "denied"; canAskAgain: boolean }
    | { status: "error"; message: string }
    | { status: "ready"; results: ContactResult[] };

const PAGE = 40;

export default function FindPeopleScreen() {
    /* ---- search ---- */
    const [input, setInput] = useState("");
    const [search, setSearch] = useState<SearchState>({ status: "idle" });

    /* ---- contacts ---- */
    const [contacts, setContacts] = useState<ContactsState>({ status: "idle" });
    const [tab, setTab] = useState<"APP" | "INVITE">("APP");
    const [filter, setFilter] = useState("");
    const [visible, setVisible] = useState(PAGE);

    /* ---- shared friend-request state ---- */
    const [relationships, setRelationships] = useState<Record<string, Relationship>>({});
    const [sendingId, setSendingId] = useState<string | null>(null);

    const relationshipOf = (person: PersonMatch) =>
        relationships[person.id] ?? person.relationship;

    const addFriend = async (id: string) => {
        try {
            setSendingId(id);
            await sendFriendRequest(id);
            setRelationships((prev) => ({ ...prev, [id]: "REQUEST_SENT" }));
        } catch (e) {
            Alert.alert("Couldn't send request", getErrorMessage(e));
        } finally {
            setSendingId(null);
        }
    };

    /* ---------------- search ---------------- */

    const runSearch = async () => {
        const query = parseQuery(input);
        if (!query) return;

        setSearch({ status: "loading" });

        try {
            if (query.kind === "username") {
                const found: UserSearchResult[] = await searchUsers(query.value);
                setSearch(
                    found.length === 0
                        ? { status: "not-found", query }
                        : {
                              status: "found",
                              people: found.map((u) => ({
                                  id: u.id,
                                  username: u.username,
                                  name: u.name,
                                  avatarUrl: u.avatarUrl,
                                  relationship: "NONE" as Relationship,
                              })),
                          }
                );
                return;
            }

            const person = await lookupUser(
                query.kind === "email" ? { email: query.value } : { phone: query.value }
            );

            setSearch(
                person
                    ? { status: "found", people: [person] }
                    : { status: "not-found", query }
            );
        } catch (e) {
            setSearch({ status: "error", message: getErrorMessage(e) });
        }
    };

    const inviteFromSearch = async (query: Query) => {
        if (query.kind === "username") return;
        const ok = await inviteByValue(query.kind, query.value);
        if (!ok) Alert.alert("Couldn't open messages", "Please try again.");
    };

    /* ---------------- contacts ---------------- */

    const syncContacts = async () => {
        try {
            setContacts({ status: "loading", label: "Asking for permission…" });

            const access = await requestContactsAccess();
            if (!access.granted) {
                setContacts({ status: "denied", canAskAgain: access.canAskAgain });
                return;
            }

            setContacts({ status: "loading", label: "Reading your contacts…" });
            const deviceContacts = await loadDeviceContacts();

            setContacts({ status: "loading", label: "Finding friends on Habit Battle…" });
            const results = await matchDeviceContacts(deviceContacts);

            setVisible(PAGE);
            setTab("APP");
            setContacts({ status: "ready", results });
        } catch (e) {
            setContacts({ status: "error", message: getErrorMessage(e) });
        }
    };

    const { onApp, toInvite } = useMemo(() => {
        if (contacts.status !== "ready") return { onApp: [], toInvite: [] };

        const q = filter.trim().toLowerCase();
        const matches = (r: ContactResult) =>
            !q || r.contact.name.toLowerCase().includes(q);

        // one row per registered user, even if several contacts matched
        const seen = new Set<string>();
        const onApp: (ContactResult & { user: NonNullable<ContactResult["user"]> })[] = [];
        for (const r of contacts.results) {
            if (!r.user || seen.has(r.user.id) || !matches(r)) continue;
            seen.add(r.user.id);
            onApp.push(r as (typeof onApp)[number]);
        }

        const toInvite = contacts.results.filter((r) => !r.user && matches(r));

        return { onApp, toInvite };
    }, [contacts, filter]);

    /* ---------------- render ---------------- */

    return (
        <Screen bottomInset>
            <ScreenHeader
                title="Find people"
                subtitle="Add friends by email, number or contacts"
                back
            />

            {/* ---------- SEARCH ---------- */}
            <View style={styles.searchRow}>
                <View style={styles.searchBox}>
                    <Search size={18} color={colors.muted} />
                    <TextInput
                        value={input}
                        onChangeText={(t) => {
                            setInput(t);
                            if (search.status !== "idle" && search.status !== "loading") {
                                setSearch({ status: "idle" });
                            }
                        }}
                        placeholder="Email, mobile number or username"
                        placeholderTextColor="#aaaaaa"
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="search"
                        onSubmitEditing={runSearch}
                        style={styles.searchInput}
                        maxLength={60}
                    />
                </View>
                <Button
                    title="Find"
                    small
                    onPress={runSearch}
                    disabled={!input.trim()}
                    loading={search.status === "loading"}
                    style={styles.findButton}
                />
            </View>

            {search.status === "error" && (
                <Text style={styles.error}>{search.message}</Text>
            )}

            {search.status === "found" &&
                search.people.map((person) => (
                    <PersonRow
                        key={person.id}
                        person={person}
                        relationship={relationshipOf(person)}
                        sending={sendingId === person.id}
                        onAdd={() => addFriend(person.id)}
                    />
                ))}

            {search.status === "not-found" && (
                <Card style={styles.notFound}>
                    <Text style={styles.notFoundTitle}>
                        {search.query.kind === "username"
                            ? "No one found with that name"
                            : `${search.query.value} isn't on Habit Battle yet`}
                    </Text>
                    {search.query.kind !== "username" && (
                        <>
                            <Text style={styles.notFoundText}>
                                Send them an invite so you can battle together.
                            </Text>
                            <Button
                                title={search.query.kind === "phone" ? "Invite by SMS" : "Invite by email"}
                                small
                                icon={
                                    search.query.kind === "phone" ? (
                                        <Send size={15} color={colors.white} />
                                    ) : (
                                        <Mail size={15} color={colors.white} />
                                    )
                                }
                                onPress={() => inviteFromSearch(search.query)}
                                style={{ marginTop: 12 }}
                            />
                        </>
                    )}
                </Card>
            )}

            {/* ---------- CONTACTS ---------- */}
            <SectionTitle
                title="From your contacts"
                subtitle="See who's already here, invite the rest"
            />

            {contacts.status === "idle" && (
                <Card style={styles.syncCard}>
                    <View style={styles.syncIcon}>
                        <Contact size={24} color={colors.text} />
                    </View>
                    <Text style={styles.syncTitle}>Find friends in your contacts</Text>
                    <Text style={styles.syncText}>
                        We check your contacts' emails and numbers against Habit Battle
                        to show who's already here. Your contacts aren't stored.
                    </Text>
                    <Button
                        title="Sync contacts"
                        onPress={syncContacts}
                        icon={<Contact size={18} color={colors.white} />}
                        style={{ marginTop: 16, alignSelf: "stretch" }}
                    />
                </Card>
            )}

            {contacts.status === "loading" && <LoadingState label={contacts.label} />}

            {contacts.status === "denied" && (
                <Card style={styles.syncCard}>
                    <Text style={styles.syncTitle}>Contacts access is off</Text>
                    <Text style={styles.syncText}>
                        Allow contacts access to find friends and invite people from
                        your phone book.
                    </Text>
                    <Button
                        title={contacts.canAskAgain ? "Allow access" : "Open settings"}
                        onPress={contacts.canAskAgain ? syncContacts : () => Linking.openSettings()}
                        style={{ marginTop: 16, alignSelf: "stretch" }}
                    />
                </Card>
            )}

            {contacts.status === "error" && (
                <Card style={styles.syncCard}>
                    <Text style={styles.syncTitle}>Couldn't sync contacts</Text>
                    <Text style={styles.syncText}>{contacts.message}</Text>
                    <Button
                        title="Try again"
                        variant="secondary"
                        onPress={syncContacts}
                        style={{ marginTop: 16, alignSelf: "stretch" }}
                    />
                </Card>
            )}

            {contacts.status === "ready" && (
                <>
                    <Segmented
                        value={tab}
                        onChange={(t) => {
                            setTab(t);
                            setVisible(PAGE);
                        }}
                        options={[
                            { label: `On Habit Battle (${onApp.length})`, value: "APP" },
                            { label: `Invite (${toInvite.length})`, value: "INVITE" },
                        ]}
                    />

                    <View style={[styles.searchBox, { marginTop: 12, marginBottom: 6 }]}>
                        <Search size={18} color={colors.muted} />
                        <TextInput
                            value={filter}
                            onChangeText={(t) => {
                                setFilter(t);
                                setVisible(PAGE);
                            }}
                            placeholder="Filter contacts by name"
                            placeholderTextColor="#aaaaaa"
                            autoCorrect={false}
                            style={styles.searchInput}
                        />
                    </View>

                    {tab === "APP" ? (
                        onApp.length === 0 ? (
                            <EmptyState
                                title="None of your contacts are here yet"
                                message="Invite them from the Invite tab."
                            />
                        ) : (
                            onApp.slice(0, visible).map(({ contact, user }) => (
                                <PersonRow
                                    key={user.id}
                                    person={user}
                                    subtitle={contact.name}
                                    relationship={relationshipOf(user)}
                                    sending={sendingId === user.id}
                                    onAdd={() => addFriend(user.id)}
                                />
                            ))
                        )
                    ) : toInvite.length === 0 ? (
                        <EmptyState
                            title="Everyone here is already on Habit Battle 🎉"
                            message="No one left to invite."
                        />
                    ) : (
                        toInvite.slice(0, visible).map(({ contact }) => (
                            <View key={contact.id} style={styles.row}>
                                <Avatar name={contact.name} size={42} dark={false} />
                                <View style={styles.info}>
                                    <Text style={styles.name} numberOfLines={1}>
                                        {contact.name}
                                    </Text>
                                    <Text style={styles.sub} numberOfLines={1}>
                                        {contact.phones[0] ?? contact.emails[0]}
                                    </Text>
                                </View>
                                <Button
                                    title="Invite"
                                    small
                                    variant="secondary"
                                    icon={<Send size={14} color={colors.text} />}
                                    onPress={async () => {
                                        const ok = await inviteContact(contact);
                                        if (!ok) {
                                            Alert.alert(
                                                "Couldn't open messages",
                                                "Please try again."
                                            );
                                        }
                                    }}
                                />
                            </View>
                        ))
                    )}

                    {visible < (tab === "APP" ? onApp.length : toInvite.length) && (
                        <Button
                            title="Show more"
                            variant="ghost"
                            small
                            onPress={() => setVisible((v) => v + PAGE)}
                        />
                    )}
                </>
            )}
        </Screen>
    );
}

/* ---------------------------------------------------------
   Row for a registered user
--------------------------------------------------------- */

function PersonRow({
    person,
    relationship,
    subtitle,
    sending,
    onAdd,
}: {
    person: PersonMatch;
    relationship: Relationship;
    subtitle?: string;
    sending: boolean;
    onAdd: () => void;
}) {
    return (
        <View style={styles.row}>
            <Avatar name={person.name || person.username} size={42} />
            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>
                    {person.name || person.username}
                </Text>
                <Text style={styles.sub} numberOfLines={1}>
                    @{person.username}
                    {subtitle && subtitle !== person.name ? ` · ${subtitle}` : ""}
                </Text>
            </View>

            {relationship === "FRIEND" ? (
                <Badge label="FRIENDS" tone="success" />
            ) : relationship === "REQUEST_RECEIVED" ? (
                <Badge label="WANTS TO ADD YOU" tone="warning" />
            ) : relationship === "REQUEST_SENT" ? (
                <Button
                    small
                    title="Requested"
                    variant="secondary"
                    disabled
                    icon={<Check size={15} color={colors.text} />}
                    onPress={() => undefined}
                />
            ) : (
                <Button
                    small
                    title="Add"
                    loading={sending}
                    icon={<UserPlus size={15} color={colors.white} />}
                    onPress={onAdd}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    searchRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
    searchBox: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        height: 50,
        paddingHorizontal: 14,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surfaceSoft,
    },
    searchInput: { flex: 1, fontSize: 15, color: colors.text },
    findButton: { minHeight: 50, paddingHorizontal: 18 },
    error: { fontSize: 13, color: colors.danger, marginBottom: 8 },

    row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
    info: { flex: 1 },
    name: { fontSize: 15, fontWeight: "700", color: colors.text },
    sub: { fontSize: 12, color: colors.muted, marginTop: 2 },

    notFound: { backgroundColor: colors.surfaceSoft },
    notFoundTitle: { fontSize: 15, fontWeight: "800", color: colors.text },
    notFoundText: { fontSize: 13, color: colors.textSoft, marginTop: 4 },

    syncCard: { alignItems: "center", paddingVertical: 24 },
    syncIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: colors.surface,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    syncTitle: { fontSize: 17, fontWeight: "800", color: colors.text, textAlign: "center" },
    syncText: {
        fontSize: 13,
        lineHeight: 19,
        color: colors.muted,
        textAlign: "center",
        marginTop: 6,
    },
});
