import { router } from "expo-router";
import {
    Bell,
    CheckCheck,
    Flame,
    Settings,
    ShieldCheck,
    Trophy,
    UserPlus,
    X,
} from "lucide-react-native";
import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import {
    deleteNotification,
    getNotifications,
    markAllNotificationsRead,
    markNotificationRead,
} from "@/api/notifications";
import type { AppNotification, NotificationType } from "@/api/types";
import {
    Button,
    EmptyState,
    ErrorState,
    LoadingState,
    Screen,
    ScreenHeader,
} from "@/components/ui";
import { colors } from "@/constants/theme";
import { useApi } from "@/hooks/useApi";
import { getErrorMessage } from "@/services/api";
import { timeAgo } from "@/utils/challenge";

function iconFor(type: NotificationType) {
    const props = { size: 20, color: colors.text };
    switch (type) {
        case "FRIEND_REQUEST":
        case "FRIEND_ACCEPTED":
            return <UserPlus {...props} />;
        case "CHALLENGE_INVITE":
        case "CHALLENGE_JOINED":
        case "CHALLENGE_COMPLETED":
            return <Trophy {...props} />;
        case "CHECK_IN_VERIFICATION":
        case "CHECK_IN_VERIFIED":
        case "CHECK_IN_REJECTED":
            return <ShieldCheck {...props} />;
        case "STREAK_MILESTONE":
            return <Flame {...props} />;
        default:
            return <Bell {...props} />;
    }
}

/** `data` is a JSON string; pull a challengeId out of it if present */
function parseChallengeId(data: string | null): string | null {
    if (!data) return null;
    try {
        const parsed = JSON.parse(data);
        return typeof parsed?.challengeId === "string" ? parsed.challengeId : null;
    } catch {
        return null;
    }
}

export default function NotificationsScreen() {
    const { data, setData, loading, error, refreshing, refresh, reload } = useApi(
        () => getNotifications({ limit: 50 })
    );
    const [busy, setBusy] = useState(false);

    const open = async (item: AppNotification) => {
        if (!item.isRead) {
            setData((prev) =>
                (prev ?? []).map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
            );
            markNotificationRead(item.id).catch(() => undefined);
        }

        const challengeId = parseChallengeId(item.data);
        if (challengeId) {
            router.push(`/challenge/${challengeId}`);
        } else if (item.type === "FRIEND_REQUEST" || item.type === "FRIEND_ACCEPTED") {
            router.push("/(tabs)/friends");
        } else if (item.type === "CHALLENGE_INVITE") {
            router.push("/challenge/explore");
        }
    };

    const remove = async (item: AppNotification) => {
        const previous = data;
        setData((prev) => (prev ?? []).filter((n) => n.id !== item.id));
        try {
            await deleteNotification(item.id);
        } catch (e) {
            setData(previous);
            Alert.alert("Couldn't delete", getErrorMessage(e));
        }
    };

    const markAll = async () => {
        try {
            setBusy(true);
            await markAllNotificationsRead();
            setData((prev) => (prev ?? []).map((n) => ({ ...n, isRead: true })));
        } catch (e) {
            Alert.alert("Couldn't update", getErrorMessage(e));
        } finally {
            setBusy(false);
        }
    };

    const unread = (data ?? []).filter((n) => !n.isRead).length;

    return (
        <Screen refreshing={refreshing} onRefresh={refresh}>
            <ScreenHeader
                title="Notifications"
                subtitle={unread > 0 ? `${unread} unread` : "You're all caught up"}
                back
                right={
                    <Pressable
                        onPress={() => router.push("/settings/notifications")}
                        hitSlop={8}
                        style={styles.settings}
                        accessibilityLabel="Notification settings"
                    >
                        <Settings size={20} color={colors.text} />
                    </Pressable>
                }
            />

            {unread > 0 && (
                <Button
                    title="Mark all as read"
                    variant="secondary"
                    small
                    loading={busy}
                    icon={<CheckCheck size={16} color={colors.text} />}
                    onPress={markAll}
                    style={{ marginBottom: 14 }}
                />
            )}

            {loading && !data ? (
                <LoadingState />
            ) : error && !data ? (
                <ErrorState message={error} onRetry={reload} />
            ) : (data ?? []).length === 0 ? (
                <EmptyState
                    icon={<Bell size={24} color={colors.textSoft} />}
                    title="No notifications yet"
                    message="Friend requests, invites and check-in updates will show up here."
                />
            ) : (
                (data ?? []).map((item) => (
                    <Pressable
                        key={item.id}
                        onPress={() => open(item)}
                        style={[styles.row, !item.isRead && styles.rowUnread]}
                    >
                        <View style={styles.icon}>{iconFor(item.type)}</View>

                        <View style={styles.body}>
                            <Text style={styles.title} numberOfLines={1}>
                                {item.title}
                            </Text>
                            <Text style={styles.message} numberOfLines={3}>
                                {item.message}
                            </Text>
                            <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
                        </View>

                        {!item.isRead && <View style={styles.dot} />}

                        <Pressable
                            onPress={() => remove(item)}
                            hitSlop={10}
                            accessibilityLabel="Delete notification"
                        >
                            <X size={16} color={colors.muted} />
                        </Pressable>
                    </Pressable>
                ))
            )}
        </Screen>
    );
}

const styles = StyleSheet.create({
    settings: {
        width: 42,
        height: 42,
        borderRadius: 21,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: "center",
        justifyContent: "center",
    },
    row: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        padding: 14,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 10,
    },
    rowUnread: { backgroundColor: colors.surfaceSoft, borderColor: "#d9d9d4" },
    icon: {
        width: 40,
        height: 40,
        borderRadius: 13,
        backgroundColor: colors.surface,
        alignItems: "center",
        justifyContent: "center",
    },
    body: { flex: 1 },
    title: { fontSize: 14, fontWeight: "800", color: colors.text },
    message: { fontSize: 13, lineHeight: 18, color: colors.textSoft, marginTop: 3 },
    time: { fontSize: 11, color: colors.muted, marginTop: 6 },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.text,
        marginTop: 6,
    },
});
