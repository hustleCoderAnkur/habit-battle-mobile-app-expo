import { router } from "expo-router";
import {
    Bell,
    ChevronRight,
    Flame,
    LogOut,
    Pencil,
    ShieldCheck,
    Trophy,
} from "lucide-react-native";
import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { logoutUser } from "@/api/auth";
import { getMyCheckInStats } from "@/api/checkIns";
import { getMe } from "@/api/users";
import {
    Avatar,
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

async function loadProfile() {
    const [me, stats] = await Promise.all([
        getMe(),
        getMyCheckInStats().catch(() => null),
    ]);
    return { me, stats };
}

export default function ProfileScreen() {
    const { data, loading, error, refreshing, refresh, reload } = useApi(loadProfile);
    const [loggingOut, setLoggingOut] = useState(false);

    const confirmLogout = () => {
        Alert.alert("Log out", "Are you sure you want to log out?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Log out",
                style: "destructive",
                onPress: async () => {
                    setLoggingOut(true);
                    await logoutUser();
                    router.replace("/(auth)/login");
                },
            },
        ]);
    };

    if (loading && !data) {
        return (
            <Screen>
                <LoadingState />
            </Screen>
        );
    }

    if (!data) {
        return (
            <Screen>
                <ErrorState message={error ?? "Please try again."} onRetry={reload} />
            </Screen>
        );
    }

    const { me, stats } = data;
    const displayName = me.name?.trim() || me.username;

    return (
        <Screen refreshing={refreshing} onRefresh={refresh}>
            <ScreenHeader title="Profile" />

            <Card style={styles.hero}>
                <Avatar name={displayName} size={72} />
                <Text style={styles.name}>{displayName}</Text>
                <Text style={styles.username}>@{me.username}</Text>
                {me.bio ? <Text style={styles.bio}>{me.bio}</Text> : null}

                <Button
                    title="Edit profile"
                    variant="secondary"
                    small
                    icon={<Pencil size={15} color={colors.text} />}
                    onPress={() => router.push("/profile/edit")}
                    style={{ marginTop: 16 }}
                />
            </Card>

            <View style={styles.statRow}>
                <StatBox
                    icon={<Trophy size={18} color={colors.textSoft} />}
                    value={me.totalPoints ?? 0}
                    label="Points"
                />
                <StatBox
                    icon={<Flame size={18} color={colors.textSoft} />}
                    value={me.currentStreak ?? 0}
                    label="Streak"
                />
                <StatBox
                    icon={<Flame size={18} color={colors.textSoft} />}
                    value={me.longestStreak ?? 0}
                    label="Best streak"
                />
            </View>

            {stats && (
                <>
                    <SectionTitle title="Check-ins" subtitle="Across all your challenges" />
                    <Card>
                        <View style={styles.checkRow}>
                            <CheckStat value={stats.total} label="Total" />
                            <CheckStat value={stats.verified} label="Verified" />
                            <CheckStat value={stats.pending} label="Pending" />
                            <CheckStat value={stats.rejected} label="Rejected" />
                        </View>
                    </Card>
                </>
            )}

            <SectionTitle title="Settings" />
            <Card style={styles.menu}>
                <MenuItem
                    icon={<Bell size={20} color={colors.text} />}
                    label="Notifications"
                    onPress={() => router.push("/settings/notifications")}
                />
                <View style={styles.menuDivider} />
                <MenuItem
                    icon={<ShieldCheck size={20} color={colors.text} />}
                    label="Account"
                    value={me.email}
                />
            </Card>

            <Button
                title="Log out"
                variant="danger"
                loading={loggingOut}
                icon={<LogOut size={18} color={colors.danger} />}
                onPress={confirmLogout}
                style={{ marginTop: 24 }}
            />
        </Screen>
    );
}

function StatBox({
    icon,
    value,
    label,
}: {
    icon: React.ReactNode;
    value: number;
    label: string;
}) {
    return (
        <View style={styles.statBox}>
            {icon}
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

function CheckStat({ value, label }: { value: number; label: string }) {
    return (
        <View style={styles.checkStat}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

function MenuItem({
    icon,
    label,
    value,
    onPress,
}: {
    icon: React.ReactNode;
    label: string;
    value?: string;
    onPress?: () => void;
}) {
    return (
        <Pressable
            onPress={onPress}
            disabled={!onPress}
            style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}
        >
            {icon}
            <Text style={styles.menuLabel}>{label}</Text>
            {value ? (
                <Text style={styles.menuValue} numberOfLines={1}>
                    {value}
                </Text>
            ) : null}
            {onPress ? <ChevronRight size={18} color={colors.muted} /> : null}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    hero: { alignItems: "center", paddingVertical: 24 },
    name: { fontSize: 22, fontWeight: "800", color: colors.text, marginTop: 14 },
    username: { fontSize: 14, color: colors.muted, marginTop: 2 },
    bio: {
        fontSize: 14,
        lineHeight: 20,
        color: colors.textSoft,
        textAlign: "center",
        marginTop: 12,
        maxWidth: 280,
    },
    statRow: { flexDirection: "row", gap: 10, marginTop: 12 },
    statBox: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 16,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.border,
    },
    statValue: { fontSize: 20, fontWeight: "800", color: colors.text, marginTop: 6 },
    statLabel: { fontSize: 11, color: colors.muted, marginTop: 2 },
    checkRow: { flexDirection: "row" },
    checkStat: { flex: 1, alignItems: "center" },
    menu: { padding: 0 },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    menuLabel: { flex: 1, fontSize: 15, fontWeight: "700", color: colors.text },
    menuValue: { maxWidth: 160, fontSize: 13, color: colors.muted },
    menuDivider: { height: 1, backgroundColor: colors.borderSoft, marginHorizontal: 16 },
});
