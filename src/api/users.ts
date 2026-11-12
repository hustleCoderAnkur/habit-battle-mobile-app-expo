import { api, ApiEnvelope } from "@/services/api";
import type {
    ContactMatch,
    Me,
    PersonMatch,
    UserSearchResult,
} from "./types";

/** /users/me nests the profile fields under `profile`; flatten them. */
interface MeResponse {
    id: string;
    email: string;
    username: string;
    phone: string | null;
    role: Me["role"];
    status: string;
    profile: {
        id: string | null;
        name: string | null;
        bio: string | null;
        avatarUrl: string | null;
        totalPoints: number | null;
        currentStreak: number | null;
        longestStreak: number | null;
    } | null;
}

/** GET /api/users/me */
export async function getMe(): Promise<Me> {
    const res = await api.get<ApiEnvelope<MeResponse>>("/users/me");
    const u = res.data.data;
    const p = u.profile;

    return {
        id: u.id,
        email: u.email,
        username: u.username,
        phone: u.phone ?? null,
        role: u.role,
        status: u.status,
        profileId: p?.id ?? null,
        name: p?.name ?? null,
        bio: p?.bio ?? null,
        avatarUrl: p?.avatarUrl ?? null,
        totalPoints: p?.totalPoints ?? 0,
        currentStreak: p?.currentStreak ?? 0,
        longestStreak: p?.longestStreak ?? 0,
    };
}

/** GET /api/users/search?q=  (username / name) */
export async function searchUsers(q: string): Promise<UserSearchResult[]> {
    const res = await api.get<ApiEnvelope<UserSearchResult[]>>("/users/search", {
        params: { q },
    });
    return res.data.data;
}

/** GET /api/users/lookup?email= | ?phone=  -> the user, or null if not registered */
export async function lookupUser(
    by: { email: string } | { phone: string }
): Promise<PersonMatch | null> {
    const res = await api.get<ApiEnvelope<PersonMatch | null>>("/users/lookup", {
        params: by,
    });
    return res.data.data;
}

/** POST /api/users/match-contacts  (max 500 emails + 500 phones per call) */
export async function matchContacts(input: {
    emails: string[];
    phones: string[];
}): Promise<ContactMatch[]> {
    const res = await api.post<ApiEnvelope<ContactMatch[]>>(
        "/users/match-contacts",
        input
    );
    return res.data.data;
}

/** PATCH /api/users/me/phone */
export async function updateMyPhone(phone: string | null): Promise<void> {
    await api.patch("/users/me/phone", { phone });
}
