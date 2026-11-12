import { api, ApiEnvelope } from "@/services/api";
import type { Friend, FriendRequest } from "./types";

/** GET /api/friendships */
export async function getFriends(): Promise<Friend[]> {
    const res = await api.get<ApiEnvelope<Friend[]>>("/friendships");
    return res.data.data;
}

/** GET /api/friendships/requests/incoming */
export async function getIncomingRequests(): Promise<FriendRequest[]> {
    const res = await api.get<ApiEnvelope<FriendRequest[]>>(
        "/friendships/requests/incoming"
    );
    return res.data.data;
}

/** GET /api/friendships/requests/outgoing */
export async function getOutgoingRequests(): Promise<FriendRequest[]> {
    const res = await api.get<ApiEnvelope<FriendRequest[]>>(
        "/friendships/requests/outgoing"
    );
    return res.data.data;
}

/** POST /api/friendships/request  { userId } */
export async function sendFriendRequest(userId: string): Promise<void> {
    await api.post("/friendships/request", { userId });
}

/** POST /api/friendships/:id/accept */
export async function acceptFriendRequest(friendshipId: string): Promise<void> {
    await api.post(`/friendships/${friendshipId}/accept`);
}

/** POST /api/friendships/:id/reject */
export async function rejectFriendRequest(friendshipId: string): Promise<void> {
    await api.post(`/friendships/${friendshipId}/reject`);
}

/** DELETE /api/friendships/:id */
export async function removeFriend(friendshipId: string): Promise<void> {
    await api.delete(`/friendships/${friendshipId}`);
}
