import { api, ApiEnvelope } from "@/services/api";
import type { AppNotification, NotificationPreferences } from "./types";

/** GET /api/notifications */
export async function getNotifications(params?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
}): Promise<AppNotification[]> {
    const res = await api.get<ApiEnvelope<AppNotification[]>>("/notifications", {
        params: params && {
            ...params,
            unreadOnly:
                params.unreadOnly === undefined ? undefined : String(params.unreadOnly),
        },
    });
    return res.data.data;
}

/** GET /api/notifications/unread/count -> { count } */
export async function getUnreadCount(): Promise<number> {
    const res = await api.get<ApiEnvelope<{ count: number }>>(
        "/notifications/unread/count"
    );
    return res.data.data.count;
}

/** PATCH /api/notifications/:id/read */
export async function markNotificationRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
}

/** PATCH /api/notifications/read-all */
export async function markAllNotificationsRead(): Promise<void> {
    await api.patch("/notifications/read-all");
}

/** DELETE /api/notifications/:id */
export async function deleteNotification(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`);
}

/** GET /api/notifications/preferences */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
    const res = await api.get<ApiEnvelope<NotificationPreferences>>(
        "/notifications/preferences"
    );
    return res.data.data;
}

/** PATCH /api/notifications/preferences */
export async function updateNotificationPreferences(
    input: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
    const res = await api.patch<ApiEnvelope<NotificationPreferences>>(
        "/notifications/preferences",
        input
    );
    return res.data.data;
}
