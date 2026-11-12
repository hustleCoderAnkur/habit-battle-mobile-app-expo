import { api, ApiEnvelope } from "@/services/api";
import type { CheckIn, CheckInStats, CheckInStatus } from "./types";

interface ListParams {
    status?: CheckInStatus;
    userId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
}

/** GET /api/check-ins/stats  (all my challenges) */
export async function getMyCheckInStats(): Promise<CheckInStats> {
    const res = await api.get<ApiEnvelope<CheckInStats>>("/check-ins/stats");
    return res.data.data;
}

/** GET /api/challenges/:challengeId/check-ins/stats */
export async function getChallengeCheckInStats(
    challengeId: string
): Promise<CheckInStats> {
    const res = await api.get<ApiEnvelope<CheckInStats>>(
        `/challenges/${challengeId}/check-ins/stats`
    );
    return res.data.data;
}

/** GET /api/challenges/:challengeId/check-ins */
export async function getChallengeCheckIns(
    challengeId: string,
    params?: ListParams
): Promise<CheckIn[]> {
    const res = await api.get<ApiEnvelope<CheckIn[]>>(
        `/challenges/${challengeId}/check-ins`,
        { params }
    );
    return res.data.data;
}

/** GET /api/challenges/:challengeId/check-ins/me */
export async function getMyCheckIns(
    challengeId: string,
    params?: ListParams
): Promise<CheckIn[]> {
    const res = await api.get<ApiEnvelope<CheckIn[]>>(
        `/challenges/${challengeId}/check-ins/me`,
        { params }
    );
    return res.data.data;
}

/** POST /api/challenges/:challengeId/check-ins */
export async function createCheckIn(
    challengeId: string,
    input: { checkInDate: string; note?: string }
): Promise<CheckIn> {
    const res = await api.post<ApiEnvelope<CheckIn>>(
        `/challenges/${challengeId}/check-ins`,
        input
    );
    return res.data.data;
}

/** PATCH /api/check-ins/:id/verify */
export async function verifyCheckIn(id: string, points?: number): Promise<void> {
    await api.patch(`/check-ins/${id}/verify`, points === undefined ? {} : { points });
}

/** PATCH /api/check-ins/:id/reject */
export async function rejectCheckIn(
    id: string,
    rejectionReason: string
): Promise<void> {
    await api.patch(`/check-ins/${id}/reject`, { rejectionReason });
}

/** DELETE /api/check-ins/:id */
export async function deleteCheckIn(id: string): Promise<void> {
    await api.delete(`/check-ins/${id}`);
}
