import { router } from "expo-router";
import { Trophy } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { getChallengeMembers, getMyChallenges } from "@/api/challenges";
import { getMe } from "@/api/users";
import { LeaderboardCard } from "@/components/challenge";
import {
    EmptyState,
    ErrorState,
    LoadingState,
    Screen,
    ScreenHeader,
} from "@/components/ui";
import { colors, radius } from "@/constants/theme";
import { useApi } from "@/hooks/useApi";
import { effectiveStatus } from "@/utils/challenge";

export default function LeaderboardScreen() {
    const challenges = useApi(async () => {
        const [mine, me] = await Promise.all([getMyChallenges(), getMe()]);
        return { mine, meId: me.id };
    });

    const [selectedId, setSelectedId] = useState<string | null>(null);

    // default to the first active challenge (or the first one)
    useEffect(() => {
        const mine = challenges.data?.mine;
        if (!mine || mine.length === 0 || selectedId) return;
        const first = mine.find((c) => effectiveStatus(c) === "ACTIVE") ?? mine[0];
        setSelectedId(first.id);
    }, [challenges.data, selectedId]);

    const members = useApi(
        () => getChallengeMembers(selectedId as string),
        [selectedId],
        { enabled: Boolean(selectedId) }
    );

    const mine = challenges.data?.mine ?? [];

    return (
        <Screen
            refreshing={members.refreshing}
            onRefresh={() => {
                challenges.silentReload();
                members.refresh();
            }}
        >
            <ScreenHeader
                title="Leaderboard"
                subtitle="See who's winning each challenge"
                back
            />

            {challenges.loading && !challenges.data ? (
                <LoadingState />
            ) : challenges.error && !challenges.data ? (
                <ErrorState message={challenges.error} onRetry={challenges.reload} />
            ) : mine.length === 0 ? (
                <EmptyState
                    icon={<Trophy size={24} color={colors.textSoft} />}
                    title="No leaderboard yet"
                    message="Join a challenge to see how you rank against others."
                    actionLabel="Discover challenges"
                    onAction={() => router.push("/challenge/discover")}
                />
            ) : (
                <>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.chips}
                        style={styles.chipScroll}
                    >
                        {mine.map((c) => {
                            const active = c.id === selectedId;
                            return (
                                <Pressable
                                    key={c.id}
                                    onPress={() => setSelectedId(c.id)}
                                    style={[styles.chip, active && styles.chipActive]}
                                >
                                    <Text
                                        style={[styles.chipText, active && styles.chipTextActive]}
                                        numberOfLines={1}
                                    >
                                        {c.name}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>

                    {members.loading && !members.data ? (
                        <LoadingState label="Loading rankings…" />
                    ) : members.error && !members.data ? (
                        <ErrorState message={members.error} onRetry={members.reload} />
                    ) : (members.data ?? []).length === 0 ? (
                        <EmptyState title="No members yet" />
                    ) : (
                        <LeaderboardCard
                            members={members.data ?? []}
                            meId={challenges.data?.meId}
                        />
                    )}
                </>
            )}
        </Screen>
    );
}

const styles = StyleSheet.create({
    chipScroll: { marginHorizontal: -20, marginBottom: 16 },
    chips: { paddingHorizontal: 20, gap: 8 },
    chip: {
        maxWidth: 200,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.border,
    },
    chipActive: { backgroundColor: colors.text, borderColor: colors.text },
    chipText: { fontSize: 13, fontWeight: "700", color: colors.textSoft },
    chipTextActive: { color: colors.white },
});
