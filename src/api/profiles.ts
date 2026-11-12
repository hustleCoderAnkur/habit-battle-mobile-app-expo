import { api, ApiEnvelope } from "@/services/api";
import type { Profile } from "./types";

/** GET /api/profiles/me */
export async function getMyProfile(): Promise<Profile> {
    const res = await api.get<ApiEnvelope<Profile>>("/profiles/me");
    return res.data.data;
}

/** GET /api/profiles/user/:userId */
export async function getProfileByUserId(userId: string): Promise<Profile> {
    const res = await api.get<ApiEnvelope<Profile>>(`/profiles/user/${userId}`);
    return res.data.data;
}

/** PATCH /api/profiles/me */
export async function updateMyProfile(input: {
    name?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
}): Promise<Profile> {
    const res = await api.patch<ApiEnvelope<Profile>>("/profiles/me", input);
    return res.data.data;
}
