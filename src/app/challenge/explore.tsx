import { router } from "expo-router";
import { Check, Mail, Search, X } from "lucide-react-native";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { getChallenge } from "@/api/challenges";
import { acceptChallengeInvite, getReceivedInvites, rejectChallengeInvite } from "@/api/invites";
import {
    Avatar,
    Button,
    Card,
    EmptyState,
    Screen,
    ScreenHeader,
    SectionTitle,
} from "@/components/ui";
import { colors } from "@/constants/theme";
import { useApi } from "@/hooks/useApi";
import { getErrorMessage } from "@/services/api";
import { timeAgo } from "@/utils/challenge";

async function loadExplore() {
    const invites = await getReceivedInvites("PENDING");

    // the invites list has no challenge name, so look it up
    const names = await Promise.all(
        invites.map((invite) =>
            getChallenge(invite.challengeId)
                .then((c) => c.name)
                .catch(() => "a challenge")
        )
    );

    return {
        invites: invites.map((invite, i) => ({ ...invite, challengeName: names[i] })),
    };
}

export default function ExploreScreen() {
    const { data, refreshing, refresh, silentReload } = useApi(loadExplore);
    const [busyId, setBusyId] = useState<string | null>(null);

    const respond = async (id: string, accept: boolean, challengeId: string) => {
        try {
            setBusyId(id);
            if (accept) {
                await acceptChallengeInvite(id);
                router.push(`/challenge/${challengeId}`);
            } else {
                await rejectChallengeInvite(id);
            }
            silentReload();
        } catch (e) {
            Alert.alert(accept ? "Couldn't accept" : "Couldn't decline", getErrorMessage(e));
        } finally {
            setBusyId(null);
        }
    };

    return (
        <Screen bottomInset refreshing={refreshing} onRefresh={refresh}>
            <ScreenHeader
                title="Explore"
                subtitle="Challenge invites and new people"
                back
            />

            <SectionTitle title="Invites" subtitle="Challenges your friends invited you to" />

            {!data ? null : data.invites.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={<Mail size={24} color={colors.textSoft} />}
                        title="No pending invites"
                        message="When a friend invites you to a challenge it will appear here."
                    />
                </Card>
            ) : (
                data.invites.map((invite) => (
                    <Card key={invite.id} style={styles.invite}>
                        <View style={styles.inviteTop}>
                            <Avatar name={invite.senderUsername} size={42} />
                            <View style={styles.flex}>
                                <Text style={styles.inviteTitle} numberOfLines={2}>
                                    {invite.senderUsername ?? "Someone"} invited you to{" "}
                                    {invite.challengeName}
                                </Text>
                                <Text style={styles.inviteTime}>{timeAgo(invite.createdAt)}</Text>
                            </View>
                        </View>

                        <View style={styles.inviteActions}>
                            <Button
                                title="Accept"
                                small
                                icon={<Check size={15} color={colors.white} />}
                                loading={busyId === invite.id}
                                onPress={() => respond(invite.id, true, invite.challengeId)}
                                style={styles.flex}
                            />
                            <Button
                                title="Decline"
                                small
                                variant="secondary"
                                icon={<X size={15} color={colors.text} />}
                                disabled={busyId === invite.id}
                                onPress={() => respond(invite.id, false, invite.challengeId)}
                                style={styles.flex}
                            />
                        </View>
                    </Card>
                ))
            )}

            <SectionTitle title="Find people" subtitle="By email, number or contacts" />
            <Button
                title="Find people"
                variant="secondary"
                icon={<Search size={18} color={colors.text} />}
                onPress={() => router.push("/friends/find")}
            />
        </Screen>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    invite: { marginBottom: 10 },
    inviteTop: { flexDirection: "row", alignItems: "center", gap: 12 },
    inviteTitle: { fontSize: 14, fontWeight: "700", color: colors.text, lineHeight: 20 },
    inviteTime: { fontSize: 11, color: colors.muted, marginTop: 3 },
    inviteActions: { flexDirection: "row", gap: 10, marginTop: 14 },
});
