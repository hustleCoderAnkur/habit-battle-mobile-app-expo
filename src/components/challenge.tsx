import { ChevronRight, Flame, Users } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { Challenge, ChallengeMember, MyChallenge } from "@/api/types";
import { Avatar, Badge, Card, ProgressBar } from "@/components/ui";
import { colors } from "@/constants/theme";
import {
    daysUntilStart,
    effectiveStatus,
    elapsedDays,
    formatRange,
    totalDays,
} from "@/utils/challenge";

/* =========================================================
   STATUS BADGE
========================================================= */

export function StatusBadge({ challenge }: { challenge: Challenge }) {
    const status = effectiveStatus(challenge);
    const tone =
        status === "ACTIVE"
            ? "success"
            : status === "UPCOMING"
              ? "warning"
              : status === "CANCELLED"
                ? "danger"
                : "neutral";
    return <Badge label={status} tone={tone} />;
}

/* =========================================================
   CHALLENGE CARD
========================================================= */

export function ChallengeCard({
    challenge,
    onPress,
}: {
    challenge: Challenge | MyChallenge;
    onPress: () => void;
}) {
    const status = effectiveStatus(challenge);
    const mine = "points" in challenge ? (challenge as MyChallenge) : null;
    const total = totalDays(challenge);
    const elapsed = elapsedDays(challenge);

    return (
        <Card onPress={onPress} style={styles.card}>
            <View style={styles.top}>
                <View style={styles.icon}>
                    <Flame size={21} color={colors.text} />
                </View>

                <View style={styles.info}>
                    <Text style={styles.title} numberOfLines={1}>
                        {challenge.name}
                    </Text>
                    <Text style={styles.subtitle} numberOfLines={1}>
                        {challenge.description?.trim() || formatRange(challenge)}
                    </Text>
                </View>

                <ChevronRight size={20} color={colors.text} />
            </View>

            {status === "ACTIVE" && (
                <View style={styles.progress}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>
                            Day {elapsed} of {total}
                        </Text>
                        <Text style={styles.progressPercent}>
                            {Math.round((elapsed / total) * 100)}%
                        </Text>
                    </View>
                    <ProgressBar value={elapsed / total} />
                </View>
            )}

            {status === "UPCOMING" && (
                <Text style={styles.startsIn}>
                    Starts in {daysUntilStart(challenge)} day
                    {daysUntilStart(challenge) === 1 ? "" : "s"} · {total} days long
                </Text>
            )}

            <View style={styles.footer}>
                {mine ? (
                    <View style={styles.meta}>
                        <Flame size={14} color={colors.muted} />
                        <Text style={styles.metaText}>
                            {mine.currentStreak}-day streak · {mine.points} pts
                        </Text>
                    </View>
                ) : (
                    <View style={styles.meta}>
                        <Users size={14} color={colors.muted} />
                        <Text style={styles.metaText}>
                            {challenge.maxMembers
                                ? `Up to ${challenge.maxMembers} members`
                                : "Open to everyone"}
                        </Text>
                    </View>
                )}
                <StatusBadge challenge={challenge} />
            </View>
        </Card>
    );
}

/* =========================================================
   LEADERBOARD
========================================================= */

export function LeaderboardCard({
    members,
    meId,
    limit,
}: {
    members: ChallengeMember[];
    meId?: string | null;
    limit?: number;
}) {
    const active = members.filter((m) => m.status === "ACTIVE");
    const ranked = active.map((member, index) => ({ member, rank: index + 1 }));
    const rows = limit ? ranked.slice(0, limit) : ranked;

    // always show me, even outside the top N
    const me = ranked.find((r) => r.member.userId === meId);
    if (limit && me && !rows.some((r) => r.member.userId === meId)) {
        rows.push(me);
    }

    return (
        <View style={styles.board}>
            {rows.map(({ member, rank }, index) => {
                const isMe = member.userId === meId;
                return (
                    <View
                        key={member.membershipId}
                        style={[
                            styles.boardRow,
                            index !== rows.length - 1 && styles.boardBorder,
                            isMe && styles.boardMe,
                        ]}
                    >
                        <Text style={styles.rank}>{rank}</Text>
                        <Avatar name={member.username} size={38} />
                        <View style={styles.boardInfo}>
                            <Text style={[styles.boardName, isMe && styles.boardNameMe]}>
                                {member.username}
                            </Text>
                            <Text style={styles.boardSub}>
                                {isMe ? "YOU · " : ""}
                                {member.currentStreak}-day streak
                            </Text>
                        </View>
                        <Text style={styles.points}>{member.points} pts</Text>
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    card: { marginBottom: 12 },
    top: { flexDirection: "row", alignItems: "center" },
    icon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: colors.surface,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    info: { flex: 1, paddingRight: 8 },
    title: { fontSize: 16, fontWeight: "800", color: colors.text },
    subtitle: { fontSize: 12, color: colors.muted, marginTop: 4 },

    progress: { marginTop: 16 },
    progressHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 7,
    },
    progressLabel: { fontSize: 11, fontWeight: "600", color: "#777777" },
    progressPercent: { fontSize: 11, fontWeight: "700", color: colors.text },
    startsIn: { fontSize: 12, color: colors.textSoft, marginTop: 14 },

    footer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 14,
    },
    meta: { flexDirection: "row", alignItems: "center", gap: 6 },
    metaText: { fontSize: 12, color: colors.muted },

    board: {
        backgroundColor: colors.bg,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 20,
        overflow: "hidden",
    },
    boardRow: {
        minHeight: 68,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        gap: 11,
    },
    boardBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
    boardMe: { backgroundColor: "#f7f7f5" },
    rank: { width: 22, fontSize: 14, fontWeight: "800", color: "#777777" },
    boardInfo: { flex: 1 },
    boardName: { fontSize: 14, fontWeight: "700", color: "#222222" },
    boardNameMe: { fontWeight: "800" },
    boardSub: { fontSize: 11, color: colors.muted, marginTop: 2 },
    points: { fontSize: 13, fontWeight: "700", color: colors.textSoft },
});
