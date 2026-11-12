import { useFocusEffect } from "expo-router";
import { BellRing } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { Alert, Linking, StyleSheet, Switch, Text, View } from "react-native";

import {
    getNotificationPreferences,
    updateNotificationPreferences,
} from "@/api/notifications";
import type { NotificationPreferences } from "@/api/types";
import {
    Button,
    Card,
    ErrorState,
    LoadingState,
    Screen,
    ScreenHeader,
    SectionTitle,
} from "@/components/ui";
import { colors } from "@/constants/theme";
import { useApi } from "@/hooks/useApi";
import { getErrorMessage } from "@/services/api";
import {
    ensureNotificationPermission,
    getNotificationPermission,
    registerDeviceForPush,
} from "@/services/notifications";

const ITEMS: { key: keyof NotificationPreferences; title: string; sub: string }[] = [
    { key: "friendRequests", title: "Friend requests", sub: "New requests and accepted friends" },
    { key: "challengeInvites", title: "Challenge invites", sub: "When someone invites you" },
    { key: "checkIns", title: "Check-ins", sub: "Verifications and rejections" },
    { key: "streaks", title: "Streaks", sub: "Milestones and reminders" },
    { key: "system", title: "Announcements", sub: "Updates from Habit Battle" },
];

export default function NotificationSettingsScreen() {
    const { data, setData, loading, error, reload } = useApi(getNotificationPreferences, [], {
        refetchOnFocus: false,
    });
    const [permission, setPermission] = useState<"granted" | "denied" | null>(null);
    const [enabling, setEnabling] = useState(false);

    useFocusEffect(
        useCallback(() => {
            getNotificationPermission().then(setPermission).catch(() => setPermission("denied"));
        }, [])
    );

    const toggle = async (key: keyof NotificationPreferences, value: boolean) => {
        const previous = data;
        setData((prev) => (prev ? { ...prev, [key]: value } : prev));
        try {
            const updated = await updateNotificationPreferences({ [key]: value });
            setData(updated);
        } catch (e) {
            setData(previous);
            Alert.alert("Couldn't update", getErrorMessage(e));
        }
    };

    const enablePush = async () => {
        try {
            setEnabling(true);
            const result = await ensureNotificationPermission();
            setPermission(result);

            if (result === "denied") {
                Alert.alert(
                    "Notifications are off",
                    "Turn them on for Habit Battle in your phone's settings.",
                    [
                        { text: "Not now", style: "cancel" },
                        { text: "Open settings", onPress: () => Linking.openSettings() },
                    ]
                );
                return;
            }

            const registered = await registerDeviceForPush();
            if (!registered) {
                Alert.alert(
                    "Almost there",
                    "Permission is on, but this build can't receive push yet. Push needs a development build with an EAS project ID."
                );
            }
        } finally {
            setEnabling(false);
        }
    };

    return (
        <Screen bottomInset>
            <ScreenHeader title="Notifications" subtitle="Choose what you want to hear about" back />

            <Card style={styles.pushCard}>
                <View style={styles.pushIcon}>
                    <BellRing size={22} color={colors.text} />
                </View>
                <View style={styles.flex}>
                    <Text style={styles.pushTitle}>Push notifications</Text>
                    <Text style={styles.pushSub}>
                        {permission === "granted"
                            ? "On — you'll get alerts even when the app is closed."
                            : "Off — turn on to get alerts when the app is closed."}
                    </Text>
                </View>
                {permission !== "granted" && (
                    <Button title="Enable" small loading={enabling} onPress={enablePush} />
                )}
            </Card>

            <SectionTitle title="Notify me about" />

            {loading && !data ? (
                <LoadingState />
            ) : error && !data ? (
                <ErrorState message={error} onRetry={reload} />
            ) : data ? (
                <Card style={{ padding: 0 }}>
                    {ITEMS.map((item, index) => (
                        <View
                            key={item.key}
                            style={[styles.row, index !== ITEMS.length - 1 && styles.rowBorder]}
                        >
                            <View style={styles.flex}>
                                <Text style={styles.rowTitle}>{item.title}</Text>
                                <Text style={styles.rowSub}>{item.sub}</Text>
                            </View>
                            <Switch
                                value={Boolean(data[item.key])}
                                onValueChange={(v) => toggle(item.key, v)}
                                trackColor={{ false: "#d9d9d4", true: colors.text }}
                                thumbColor={colors.white}
                            />
                        </View>
                    ))}
                </Card>
            ) : null}
        </Screen>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    pushCard: { flexDirection: "row", alignItems: "center", gap: 12 },
    pushIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: colors.surface,
        alignItems: "center",
        justifyContent: "center",
    },
    pushTitle: { fontSize: 15, fontWeight: "800", color: colors.text },
    pushSub: { fontSize: 12, lineHeight: 17, color: colors.muted, marginTop: 2 },
    row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
    rowTitle: { fontSize: 15, fontWeight: "700", color: colors.text },
    rowSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
});
