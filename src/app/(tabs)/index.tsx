import { router } from "expo-router";
import {
    Bell,
    Compass,
    Flame,
    Gamepad2,
    Plus,
    Search,
    Trophy,
    Users,
} from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { getFriends } from "@/api/friendships";
import { getChallengeMembers, getMyChallenges } from "@/api/challenges";
import { getMe } from "@/api/users";
import type { ChallengeMember, Friend, Me, MyChallenge } from "@/api/types";
import { ChallengeCard, LeaderboardCard } from "@/components/challenge";
import {
    Button,
    Card,
    EmptyState,
    ErrorState,
    LoadingState,
    Screen,
    SectionTitle,
} from "@/components/ui";
import { colors, radius } from "@/constants/theme";
import { useApi } from "@/hooks/useApi";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import {
    ensureNotificationPermission,
    registerDeviceForPush,
} from "@/services/notifications";
import { effectiveStatus } from "@/utils/challenge";

/* ---------------------------------------------------------
   Greeting: picked once per app open (module scope), so it
   changes on every launch but stays stable while browsing.
--------------------------------------------------------- */

const GREETINGS = [
    { eyebrow: "WELCOME BACK", title: "Let's battle 👋", subtitle: "Small progress. Big results." },
    { eyebrow: "GOOD TO SEE YOU", title: "Ready to battle? ⚔️", subtitle: "Your next win starts today." },
    { eyebrow: "KEEP GOING", title: "One more day. 🔥", subtitle: "Consistency beats motivation." },
    { eyebrow: "YOUR JOURNEY", title: "Make today count.", subtitle: "Show up. Check in. Compete." },
    { eyebrow: "LET'S GO", title: "Time to show up. 💪", subtitle: "Your streak is watching." },
    { eyebrow: "NEW DAY", title: "Fresh start. ✨", subtitle: "Win the day, win the battle." },
];

const GREETING = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];

/* ---------------------------------------------------------
   Data
--------------------------------------------------------- */

interface HomeData {
    me: Me;
    challenges: MyChallenge[];
    friends: Friend[] | null;
    board: { challengeName: string; members: ChallengeMember[] } | null;
}

async function loadHome(): Promise<HomeData> {
    const [me, challenges, friends] = await Promise.all([
        getMe(),
        getMyChallenges(),
        getFriends().catch(() => null),
    ]);

    // Leaderboard preview: the active challenge I'm doing best in
    const featured = [...challenges]
        .filter((c) => effectiveStatus(c) === "ACTIVE")
        .sort((a, b) => b.points - a.points)[0];

    let board: HomeData["board"] = null;
    if (featured) {
        try {
            board = {
                challengeName: featured.name,
                members: await getChallengeMembers(featured.id),
            };
        } catch {
            board = null;
        }
    }

    return { me, challenges, friends, board };
}

/* ---------------------------------------------------------
   Screen
--------------------------------------------------------- */

export default function HomeScreen() {
    const { data, loading, error, refreshing, refresh, reload } = useApi(loadHome);
    const { count: unread } = useUnreadCount();

    const handleBell = async () => {
        // Ask for permission the first time; the in-app list works either way
        const result = await ensureNotificationPermission();
        if (result === "granted") registerDeviceForPush();
        router.push("/(tabs)/notifications");
    };

    if (loading && !data) {
        return (
            <Screen>
                <LoadingState label="Loading your battles…" />
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

    const { me, challenges, friends, board } = data;
    const active = challenges.filter((c) => effectiveStatus(c) === "ACTIVE");
    const upcoming = challenges.filter((c) => effectiveStatus(c) === "UPCOMING");
    const shown = [...active, ...upcoming].slice(0, 3);
    const displayName = (me.name?.trim() || me.username).split(" ")[0];

    return (
        <Screen refreshing={refreshing} onRefresh={refresh}>
            {/* HEADER */}
            <View style={styles.header}>
                <View style={styles.headerText}>
                    <Text style={styles.eyebrow}>
                        {GREETING.eyebrow}, {displayName.toUpperCase()}
                    </Text>
                    <Text style={styles.headerTitle}>{GREETING.title}</Text>
                    <Text style={styles.headerSubtitle}>{GREETING.subtitle}</Text>
                </View>

                <Pressable
                    style={styles.bell}
                    onPress={handleBell}
                    accessibilityLabel="Notifications"
                >
                    <Bell size={23} color={colors.text} />
                    {unread > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                                {unread > 9 ? "9+" : unread}
                            </Text>
                        </View>
                    )}
                </Pressable>
            </View>

            {/* SCORE */}
            <Card style={styles.scoreCard}>
                <View style={styles.scoreTop}>
                    <View>
                        <Text style={styles.eyebrowSmall}>YOUR SCORE</Text>
                        <Text style={styles.score}>{me.totalPoints ?? 0}</Text>
                    </View>
                    <View style={styles.scoreIcon}>
                        <Trophy size={27} color={colors.text} />
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.statsRow}>
                    <MiniStat
                        icon={<Flame size={20} color="#666666" />}
                        value={me.currentStreak ?? 0}
                        label="Streak"
                    />
                    <View style={styles.statDivider} />
                    <MiniStat
                        icon={<Gamepad2 size={20} color="#666666" />}
                        value={active.length}
                        label="Active"
                    />
                    <View style={styles.statDivider} />
                    <MiniStat
                        icon={<Users size={20} color="#666666" />}
                        value={friends?.length ?? "–"}
                        label="Friends"
                    />
                </View>
            </Card>

            {/* QUICK ACTIONS */}
            <SectionTitle title="Quick actions" />
            <View style={styles.quickActions}>
                <QuickAction
                    icon={<Plus size={24} color={colors.text} />}
                    title="Create"
                    subtitle="Start a challenge"
                    onPress={() => router.push("/challenge/create")}
                />
                <QuickAction
                    icon={<Search size={23} color={colors.text} />}
                    title="Discover"
                    subtitle="Find & join"
                    onPress={() => router.push("/challenge/discover")}
                />
                <QuickAction
                    icon={<Compass size={23} color={colors.text} />}
                    title="Explore"
                    subtitle="People & invites"
                    onPress={() => router.push("/challenge/explore")}
                />
            </View>

            {/* LEADERBOARD */}
            {board && board.members.length > 0 && (
                <>
                    <SectionTitle
                        title="Leaderboard"
                        subtitle={board.challengeName}
                        actionLabel="See all"
                        onAction={() => router.push("/(tabs)/leaderboard")}
                    />
                    <LeaderboardCard members={board.members} meId={me.id} limit={3} />
                </>
            )}

            {/* ACTIVE CHALLENGES */}
            <SectionTitle
                title="Your challenges"
                subtitle="Keep your streak alive"
                actionLabel={challenges.length > 0 ? "See all" : undefined}
                onAction={() => router.push("/(tabs)/challenges")}
            />

            {shown.length === 0 ? (
                <Card>
                    <EmptyState
                        title="No challenges yet"
                        message="Create one with friends, or find an open challenge to join."
                        icon={<Flame size={24} color={colors.textSoft} />}
                        actionLabel="Create challenge"
                        onAction={() => router.push("/challenge/create")}
                    />
                </Card>
            ) : (
                shown.map((challenge) => (
                    <ChallengeCard
                        key={challenge.id}
                        challenge={challenge}
                        onPress={() => router.push(`/challenge/${challenge.id}`)}
                    />
                ))
            )}

            {shown.length > 0 && (
                <Button
                    title="Create challenge"
                    variant="secondary"
                    icon={<Plus size={18} color={colors.text} />}
                    onPress={() => router.push("/challenge/create")}
                />
            )}
        </Screen>
    );
}

/* ---------------------------------------------------------
   Small components
--------------------------------------------------------- */

function MiniStat({
    icon,
    value,
    label,
}: {
    icon: React.ReactNode;
    value: number | string;
    label: string;
}) {
    return (
        <View style={styles.miniStat}>
            {icon}
            <Text style={styles.miniStatValue}>{value}</Text>
            <Text style={styles.miniStatLabel}>{label}</Text>
        </View>
    );
}

function QuickAction({
    icon,
    title,
    subtitle,
    onPress,
}: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    onPress: () => void;
}) {
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [styles.quickAction, pressed && { opacity: 0.75 }]}
        >
            <View style={styles.quickIcon}>{icon}</View>
            <Text style={styles.quickTitle}>{title}</Text>
            <Text style={styles.quickSubtitle} numberOfLines={1}>
                {subtitle}
            </Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: 24,
    },
    headerText: { flex: 1, paddingRight: 16 },
    eyebrow: {
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 1.3,
        color: colors.muted,
        marginBottom: 6,
    },
    headerTitle: {
        fontSize: 30,
        lineHeight: 36,
        fontWeight: "800",
        color: colors.text,
        letterSpacing: -1,
    },
    headerSubtitle: { fontSize: 14, lineHeight: 20, color: "#777777", marginTop: 5 },

    bell: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: "center",
        justifyContent: "center",
    },
    badge: {
        position: "absolute",
        top: -3,
        right: -3,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        paddingHorizontal: 5,
        backgroundColor: colors.text,
        borderWidth: 2,
        borderColor: colors.bg,
        alignItems: "center",
        justifyContent: "center",
    },
    badgeText: { color: colors.white, fontSize: 10, fontWeight: "800" },

    scoreCard: { borderRadius: radius.xl, padding: 20 },
    scoreTop: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    eyebrowSmall: {
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 1.4,
        color: colors.muted,
        marginBottom: 5,
    },
    score: {
        fontSize: 46,
        lineHeight: 52,
        fontWeight: "800",
        color: colors.text,
        letterSpacing: -2,
    },
    scoreIcon: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: colors.surface,
        alignItems: "center",
        justifyContent: "center",
    },
    divider: { height: 1, backgroundColor: "#e9e9e9", marginVertical: 18 },
    statsRow: { flexDirection: "row", alignItems: "center" },
    miniStat: { flex: 1, alignItems: "center" },
    miniStatValue: { fontSize: 20, fontWeight: "800", color: colors.text, marginTop: 5 },
    miniStatLabel: { fontSize: 12, color: colors.muted, marginTop: 2 },
    statDivider: { width: 1, height: 38, backgroundColor: "#e9e9e9" },

    quickActions: { flexDirection: "row", gap: 10 },
    quickAction: {
        flex: 1,
        minHeight: 130,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 14,
        justifyContent: "space-between",
    },
    quickIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: colors.surface,
        alignItems: "center",
        justifyContent: "center",
    },
    quickTitle: { fontSize: 17, fontWeight: "800", color: colors.text, marginTop: 10 },
    quickSubtitle: { fontSize: 11, color: colors.muted, marginTop: 2 },
});
