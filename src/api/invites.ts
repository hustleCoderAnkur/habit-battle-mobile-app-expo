import { api, ApiEnvelope } from "@/services/api";
import type { ChallengeInvite, InviteStatus } from "./types";

/** GET /api/challenge-invites  (invites I received) */
export async function getReceivedInvites(
    status?: InviteStatus
): Promise<ChallengeInvite[]> {
    const res = await api.get<ApiEnvelope<ChallengeInvite[]>>("/challenge-invites", {
        params: status ? { status } : undefined,
    });
    return res.data.data;
}

/** POST /api/challenge-invites  { challengeId, receiverId } */
export async function sendChallengeInvite(
    challengeId: string,
    receiverId: string
): Promise<void> {
    await api.post("/challenge-invites", { challengeId, receiverId });
}

/** POST /api/challenge-invites/:id/accept */
export async function acceptChallengeInvite(id: string): Promise<void> {
    await api.post(`/challenge-invites/${id}/accept`);
}

/** POST /api/challenge-invites/:id/reject */
export async function rejectChallengeInvite(id: string): Promise<void> {
    await api.post(`/challenge-invites/${id}/reject`);
}

/** DELETE /api/challenge-invites/:id  (cancel one I sent) */
export async function cancelChallengeInvite(id: string): Promise<void> {
    await api.delete(`/challenge-invites/${id}`);
}
