import { router, useLocalSearchParams } from "expo-router";
import {
    Calendar,
    CheckCircle2,
    Flame,
    Trophy,
    UserPlus,
} from "lucide-react-native";
import React, { useState } from "react";
import {
    Alert,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import {
    cancelChallenge,
    getChallenge,
    getChallengeMembers,
    joinChallenge,
    leaveChallenge,
} from "@/api/challenges";
import { getChallengeCheckIns, getMyCheckIns, rejectCheckIn, verifyCheckIn } from "@/api/checkIns";
import { getMe } from "@/api/users";
import type { CheckIn } from "@/api/types";
import { LeaderboardCard, StatusBadge } from "@/components/challenge";
import {
    Avatar,
    Badge,
    Button,
    Card,
    EmptyState,
    ErrorState,
    LoadingState,
    ProgressBar,
    Screen,
    ScreenHeader,
    SectionTitle,
} from "@/components/ui";
import { colors, radius } from "@/constants/theme";
import { useApi } from "@/hooks/useApi";
import { getErrorMessage } from "@/services/api";
import {
    dayKey,
    daysUntilStart,
    effectiveStatus,
    elapsedDays,
    formatDate,
    formatRange,
    todayKey,
    totalDays,
} from "@/utils/challenge";

async function loadDetail(id: string) {
    const [challenge, members, me, feed, mine] = await Promise.all([
        getChallenge(id),
        getChallengeMembers(id),
        getMe(),
        getChallengeCheckIns(id, { limit: 30 }).catch(() => [] as CheckIn[]),
        getMyCheckIns(id, { limit: 5 }).catch(() => [] as CheckIn[]),
    ]);
    return { challenge, members, me, feed, mine };
}

export default function ChallengeDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { data, loading, error, refreshing, refresh, reload, silentReload } = useApi(
        () => loadDetail(id),
        [id]
    );

    const [busy, setBusy] = useState<string | null>(null);
    const [rejecting, setRejecting] = useState<CheckIn | null>(null);
    const [reason, setReason] = useState("");

    if (loading && !data) {
        return (
            <Screen bottomInset>
                <ScreenHeader title="Challenge" back />
                <LoadingState />
            </Screen>
        );
    }

    if (!data) {
        return (
            <Screen bottomInset>
                <ScreenHeader title="Challenge" back />
                <ErrorState message={error ?? "Please try again."} onRetry={reload} />
            </Screen>
        );
    }

    const { challenge, members, me, feed, mine } = data;
    const status = effectiveStatus(challenge);
    const membership = members.find((m) => m.userId === me.id && m.status === "ACTIVE");
    const isMember = Boolean(membership);
    const isOwner = challenge.createdBy === me.id;
    const rank = membership
        ? members.filter((m) => m.status === "ACTIVE").findIndex((m) => m.userId === me.id) + 1
        : 0;
    const total = totalDays(challenge);
    const elapsed = elapsedDays(challenge);
    const todaysCheckIn = mine.find((c) => dayKey(c.checkInDate) === todayKey());
    const canJoin = !isMember && (status === "ACTIVE" || status === "UPCOMING");
    const pendingForMe = feed.filter(
        (c) => c.status === "PENDING" && c.userId !== me.id
    );

    /* ---------------- actions ---------------- */

    const run = async (key: string, action: () => Promise<void>, failTitle: string) => {
        try {
            setBusy(key);
            await action();
            await silentReload();
        } catch (e) {
            Alert.alert(failTitle, getErrorMessage(e));
        } finally {
            setBusy(null);
        }
    };

    const confirmLeave = () =>
        Alert.alert("Leave challenge", "You'll stop earning points here. Leave anyway?", [
            { text: "Stay", style: "cancel" },
            {
                text: "Leave",
                style: "destructive",
                onPress: () => run("leave", () => leaveChallenge(id), "Couldn't leave"),
            },
        ]);

    const confirmCancel = () =>
        Alert.alert(
            "Cancel challenge",
            "This ends the challenge for everyone. This can't be undone.",
            [
                { text: "Keep it", style: "cancel" },
                {
                    text: "Cancel challenge",
                    style: "destructive",
                    onPress: () =>
                        run("cancel", () => cancelChallenge(id), "Couldn't cancel"),
                },
            ]
        );

    const submitReject = async () => {
        if (!rejecting) return;
        const text = reason.trim();
        if (!text) {
            Alert.alert("Reason needed", "Tell them why you're rejecting this check-in.");
            return;
        }
        const target = rejecting;
        setRejecting(null);
        setReason("");
        await run(
            target.id,
            () => rejectCheckIn(target.id, text),
            "Couldn't reject check-in"
        );
    };

    return (
        <>
            <Screen bottomInset refreshing={refreshing} onRefresh={refresh}>
                <ScreenHeader title={challenge.name} back right={<StatusBadge challenge={challenge} />} />

                {/* OVERVIEW */}
                <Card>
                    {challenge.description ? (
                        <Text style={styles.description}>{challenge.description}</Text>
                    ) : null}

                    <View style={styles.metaRow}>
                        <Calendar size={16} color={colors.muted} />
                        <Text style={styles.metaText}>{formatRange(challenge)}</Text>
                    </View>

                    {status === "ACTIVE" && (
                        <View style={{ marginTop: 16 }}>
                            <View style={styles.progressHeader}>
                                <Text style={styles.progressLabel}>
                                    Day {elapsed} of {total}
                                </Text>
                                <Text style={styles.progressLabel}>
                                    {Math.round((elapsed / total) * 100)}%
                                </Text>
                            </View>
                            <ProgressBar value={elapsed / total} />
                        </View>
                    )}

                    {status === "UPCOMING" && (
                        <Text style={styles.note}>
                            Starts in {daysUntilStart(challenge)} day
                            {daysUntilStart(challenge) === 1 ? "" : "s"}
                        </Text>
                    )}
                </Card>

                {/* MY STATS */}
                {membership && (
                    <View style={styles.statRow}>
                        <Stat icon={<Trophy size={18} color={colors.textSoft} />} value={membership.points} label="Points" />
                        <Stat icon={<Flame size={18} color={colors.textSoft} />} value={membership.currentStreak} label="Streak" />
                        <Stat icon={<Trophy size={18} color={colors.textSoft} />} value={rank > 0 ? `#${rank}` : "–"} label="Rank" />
                    </View>
                )}

                {/* ACTIONS */}
                <View style={styles.actions}>
                    {canJoin && (
                        <Button
                            title="Join challenge"
                            loading={busy === "join"}
                            onPress={() => run("join", () => joinChallenge(id), "Couldn't join")}
                        />
                    )}

                    {isMember && status === "ACTIVE" && !todaysCheckIn && (
                        <Button
                            title="Check in for today"
                            icon={<CheckCircle2 size={18} color={colors.white} />}
                            onPress={() => router.push(`/challenge/${id}/check-in`)}
                        />
                    )}

                    {isMember && todaysCheckIn && (
                        <View style={styles.doneBanner}>
                            <CheckCircle2 size={18} color={colors.success} />
                            <Text style={styles.doneText}>
                                Checked in today ·{" "}
                                {todaysCheckIn.status === "VERIFIED"
                                    ? "verified"
                                    : todaysCheckIn.status === "REJECTED"
                                      ? "rejected"
                                      : "waiting for verification"}
                            </Text>
                        </View>
                    )}

                    {isMember && (status === "ACTIVE" || status === "UPCOMING") && (
                        <Button
                            title="Invite friends"
                            variant="secondary"
                            icon={<UserPlus size={18} color={colors.text} />}
                            onPress={() => router.push(`/challenge/${id}/invite`)}
                        />
                    )}
                </View>

                {/* LEADERBOARD */}
                <SectionTitle
                    title="Leaderboard"
                    subtitle={`${members.filter((m) => m.status === "ACTIVE").length} members`}
                />
                {members.length === 0 ? (
                    <EmptyState title="No members yet" />
                ) : (
                    <LeaderboardCard members={members} meId={me.id} limit={10} />
                )}

                {/* VERIFY */}
                {isMember && pendingForMe.length > 0 && (
                    <>
                        <SectionTitle
                            title="Needs your verification"
                            subtitle="Verify your friends' check-ins to award points"
                        />
                        {pendingForMe.map((item) => (
                            <Card key={item.id} style={styles.verifyCard}>
                                <CheckInHeader item={item} />
                                <View style={styles.verifyActions}>
                                    <Button
                                        title="Verify"
                                        small
                                        loading={busy === item.id}
                                        onPress={() =>
                                            run(item.id, () => verifyCheckIn(item.id), "Couldn't verify")
                                        }
                                        style={styles.flex}
                                    />
                                    <Button
                                        title="Reject"
                                        small
                                        variant="danger"
                                        disabled={busy === item.id}
                                        onPress={() => setRejecting(item)}
                                        style={styles.flex}
                                    />
                                </View>
                            </Card>
                        ))}
                    </>
                )}

                {/* ACTIVITY */}
                <SectionTitle title="Recent check-ins" />
                {feed.length === 0 ? (
                    <Card>
                        <EmptyState
                            title="No check-ins yet"
                            message="Check-ins from members will show up here."
                        />
                    </Card>
                ) : (
                    feed.slice(0, 15).map((item) => (
                        <Card key={item.id} style={styles.feedCard}>
                            <CheckInHeader item={item} />
                        </Card>
                    ))
                )}

                {/* DANGER ZONE */}
                {isMember && !isOwner && status !== "COMPLETED" && status !== "CANCELLED" && (
                    <Button
                        title="Leave challenge"
                        variant="danger"
                        loading={busy === "leave"}
                        onPress={confirmLeave}
                        style={{ marginTop: 24 }}
                    />
                )}
                {isOwner && status !== "COMPLETED" && status !== "CANCELLED" && (
                    <Button
                        title="Cancel challenge"
                        variant="danger"
                        loading={busy === "cancel"}
                        onPress={confirmCancel}
                        style={{ marginTop: 24 }}
                    />
                )}
            </Screen>

            {/* REJECT REASON */}
            <Modal
                visible={Boolean(rejecting)}
                transparent
                animationType="fade"
                onRequestClose={() => setRejecting(null)}
            >
                <View style={styles.backdrop}>
                    <View style={styles.sheet}>
                        <Text style={styles.sheetTitle}>Reject check-in</Text>
                        <Text style={styles.sheetSub}>
                            {rejecting?.username} will see your reason.
                        </Text>
                        <TextInput
                            value={reason}
                            onChangeText={setReason}
                            placeholder="Why are you rejecting this?"
                            placeholderTextColor="#aaaaaa"
                            multiline
                            maxLength={500}
                            style={styles.reasonInput}
                            autoFocus
                        />
                        <View style={styles.verifyActions}>
                            <Button
                                title="Cancel"
                                variant="secondary"
                                small
                                onPress={() => {
                                    setRejecting(null);
                                    setReason("");
                                }}
                                style={styles.flex}
                            />
                            <Button
                                title="Reject"
                                variant="danger"
                                small
                                onPress={submitReject}
                                style={styles.flex}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}

/* ---------------------------------------------------------
   Pieces
--------------------------------------------------------- */

function Stat({
    icon,
    value,
    label,
}: {
    icon: React.ReactNode;
    value: number | string;
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

function CheckInHeader({ item }: { item: CheckIn }) {
    const tone =
        item.status === "VERIFIED"
            ? "success"
            : item.status === "REJECTED"
              ? "danger"
              : "warning";

    return (
        <View>
            <View style={styles.checkTop}>
                <Avatar name={item.username} size={36} />
                <View style={styles.flex}>
                    <Text style={styles.checkName}>{item.username}</Text>
                    <Text style={styles.checkDate}>{formatDate(item.checkInDate)}</Text>
                </View>
                <Badge label={item.status} tone={tone} />
            </View>
            {item.note ? <Text style={styles.checkNote}>{item.note}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    description: { fontSize: 14, lineHeight: 21, color: colors.textSoft, marginBottom: 14 },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    metaText: { fontSize: 13, fontWeight: "600", color: colors.textSoft },
    progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 7 },
    progressLabel: { fontSize: 11, fontWeight: "700", color: colors.textSoft },
    note: { fontSize: 13, color: colors.textSoft, marginTop: 14 },

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

    actions: { gap: 10, marginTop: 16 },
    doneBanner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        padding: 14,
        borderRadius: radius.md,
        backgroundColor: colors.successBg,
    },
    doneText: { flex: 1, fontSize: 13, fontWeight: "700", color: colors.success },

    verifyCard: { marginBottom: 10 },
    verifyActions: { flexDirection: "row", gap: 10, marginTop: 14 },
    feedCard: { marginBottom: 10, padding: 14 },
    checkTop: { flexDirection: "row", alignItems: "center", gap: 10 },
    checkName: { fontSize: 14, fontWeight: "800", color: colors.text },
    checkDate: { fontSize: 11, color: colors.muted, marginTop: 1 },
    checkNote: { fontSize: 13, lineHeight: 19, color: colors.textSoft, marginTop: 10 },

    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        padding: 24,
    },
    sheet: { backgroundColor: colors.bg, borderRadius: radius.xl, padding: 20 },
    sheetTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
    sheetSub: { fontSize: 13, color: colors.muted, marginTop: 4, marginBottom: 14 },
    reasonInput: {
        minHeight: 90,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        padding: 12,
        fontSize: 15,
        color: colors.text,
        textAlignVertical: "top",
        backgroundColor: colors.surfaceSoft,
    },
});
