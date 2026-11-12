import { api, ApiEnvelope } from "@/services/api";
import type {
    Challenge,
    ChallengeMember,
    ChallengeStatus,
    CreateChallengeInput,
    MyChallenge,
} from "./types";

/** GET /api/challenges  (public list: filter + search + paging) */
export async function listChallenges(params?: {
    status?: ChallengeStatus;
    search?: string;
    limit?: number;
    offset?: number;
}): Promise<Challenge[]> {
    const res = await api.get<ApiEnvelope<Challenge[]>>("/challenges", { params });
    return res.data.data;
}

/** GET /api/challenges/me */
export async function getMyChallenges(): Promise<MyChallenge[]> {
    const res = await api.get<ApiEnvelope<MyChallenge[]>>("/challenges/me");
    return res.data.data;
}

/** GET /api/challenges/:id */
export async function getChallenge(id: string): Promise<Challenge> {
    const res = await api.get<ApiEnvelope<Challenge>>(`/challenges/${id}`);
    return res.data.data;
}

/** POST /api/challenges  -> { challenge, member } */
export async function createChallenge(input: CreateChallengeInput) {
    const res = await api.post<
        ApiEnvelope<{ challenge: Challenge; member: unknown }>
    >("/challenges", input);
    return res.data.data;
}

/** PATCH /api/challenges/:id */
export async function updateChallenge(
    id: string,
    input: Partial<Omit<CreateChallengeInput, "description">> & {
        description?: string | null;
    }
): Promise<Challenge> {
    const res = await api.patch<ApiEnvelope<Challenge>>(`/challenges/${id}`, input);
    return res.data.data;
}

/** DELETE /api/challenges/:id  (marks CANCELLED) */
export async function cancelChallenge(id: string): Promise<void> {
    await api.delete(`/challenges/${id}`);
}

/** POST /api/challenges/:id/join */
export async function joinChallenge(id: string): Promise<void> {
    await api.post(`/challenges/${id}/join`);
}

/** POST /api/challenges/:id/leave */
export async function leaveChallenge(id: string): Promise<void> {
    await api.post(`/challenges/${id}/leave`);
}

/** GET /api/challenges/:id/members  (already sorted by points desc) */
export async function getChallengeMembers(id: string): Promise<ChallengeMember[]> {
    const res = await api.get<ApiEnvelope<ChallengeMember[]>>(
        `/challenges/${id}/members`
    );
    return res.data.data;
}
