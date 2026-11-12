import { useLocalSearchParams } from "expo-router";
import { Check, Send, Users } from "lucide-react-native";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { getChallengeMembers } from "@/api/challenges";
import { getFriends } from "@/api/friendships";
import { sendChallengeInvite } from "@/api/invites";
import {
    Avatar,
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

export default function InviteScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { data, loading, error, reload } = useApi(async () => {
        const [friends, members] = await Promise.all([getFriends(), getChallengeMembers(id)]);
        const memberIds = new Set(
            members.filter((m) => m.status === "ACTIVE").map((m) => m.userId)
        );
        return friends.filter((f) => !memberIds.has(f.userId));
    }, [id]);

    const [invited, setInvited] = useState<Set<string>>(new Set());
    const [sending, setSending] = useState<string | null>(null);

    const invite = async (userId: string) => {
        try {
            setSending(userId);
            await sendChallengeInvite(id, userId);
            setInvited((prev) => new Set(prev).add(userId));
        } catch (e) {
            Alert.alert("Couldn't send invite", getErrorMessage(e));
        } finally {
            setSending(null);
        }
    };

    return (
        <Screen bottomInset>
            <ScreenHeader title="Invite friends" subtitle="They'll get a notification" back />

            {loading && !data ? (
                <LoadingState />
            ) : error && !data ? (
                <ErrorState message={error} onRetry={reload} />
            ) : (data ?? []).length === 0 ? (
                <EmptyState
                    icon={<Users size={24} color={colors.textSoft} />}
                    title="No one to invite"
                    message="All your friends are already in this challenge, or you haven't added any friends yet."
                />
            ) : (
                data!.map((friend) => {
                    const done = invited.has(friend.userId);
                    return (
                        <View key={friend.friendshipId} style={styles.row}>
                            <Avatar name={friend.username} size={44} />
                            <View style={styles.info}>
                                <Text style={styles.name}>{friend.username ?? "Unknown"}</Text>
                                {friend.email ? <Text style={styles.sub}>{friend.email}</Text> : null}
                            </View>
                            <Button
                                small
                                title={done ? "Invited" : "Invite"}
                                variant={done ? "secondary" : "primary"}
                                disabled={done}
                                loading={sending === friend.userId}
                                icon={
                                    done ? (
                                        <Check size={15} color={colors.text} />
                                    ) : (
                                        <Send size={15} color={colors.white} />
                                    )
                                }
                                onPress={() => invite(friend.userId)}
                            />
                        </View>
                    );
                })
            )}
        </Screen>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
    info: { flex: 1 },
    name: { fontSize: 15, fontWeight: "700", color: colors.text },
    sub: { fontSize: 12, color: colors.muted, marginTop: 2 },
});
