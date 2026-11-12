import { router } from "expo-router";
import { Check, Search, UserMinus, Users, X } from "lucide-react-native";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import {
    acceptFriendRequest,
    getFriends,
    getIncomingRequests,
    getOutgoingRequests,
    rejectFriendRequest,
    removeFriend,
} from "@/api/friendships";
import {
    Avatar,
    Button,
    Card,
    EmptyState,
    ErrorState,
    LoadingState,
    Screen,
    ScreenHeader,
    SectionTitle,
    Segmented,
} from "@/components/ui";
import { colors } from "@/constants/theme";
import { useApi } from "@/hooks/useApi";
import { getErrorMessage } from "@/services/api";

type Tab = "FRIENDS" | "REQUESTS";

async function loadAll() {
    const [friends, incoming, outgoing] = await Promise.all([
        getFriends(),
        getIncomingRequests(),
        getOutgoingRequests(),
    ]);
    return { friends, incoming, outgoing };
}

export default function FriendsScreen() {
    const { data, loading, error, refreshing, refresh, reload, silentReload } =
        useApi(loadAll);
    const [tab, setTab] = useState<Tab>("FRIENDS");
    const [busyId, setBusyId] = useState<string | null>(null);

    const act = async (id: string, action: () => Promise<void>, failTitle: string) => {
        try {
            setBusyId(id);
            await action();
            await silentReload();
        } catch (e) {
            Alert.alert(failTitle, getErrorMessage(e));
        } finally {
            setBusyId(null);
        }
    };

    const confirmRemove = (friendshipId: string, name: string) => {
        Alert.alert("Remove friend", `Remove ${name} from your friends?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Remove",
                style: "destructive",
                onPress: () =>
                    act(friendshipId, () => removeFriend(friendshipId), "Couldn't remove"),
            },
        ]);
    };

    const incomingCount = data?.incoming.length ?? 0;

    return (
        <Screen refreshing={refreshing} onRefresh={refresh}>
            <ScreenHeader
                title="Friends"
                subtitle="Battle together, stay accountable"
            />

            <Button
                title="Find people"
                icon={<Search size={18} color={colors.white} />}
                onPress={() => router.push("/friends/find")}
                style={{ marginBottom: 16 }}
            />

            <Segmented
                value={tab}
                onChange={setTab}
                options={[
                    { label: "Friends", value: "FRIENDS" },
                    {
                        label: incomingCount > 0 ? `Requests (${incomingCount})` : "Requests",
                        value: "REQUESTS",
                    },
                ]}
            />

            <View style={{ height: 16 }} />

            {loading && !data ? (
                <LoadingState />
            ) : error && !data ? (
                <ErrorState message={error} onRetry={reload} />
            ) : tab === "FRIENDS" ? (
                data!.friends.length === 0 ? (
                    <EmptyState
                        icon={<Users size={24} color={colors.textSoft} />}
                        title="No friends yet"
                        message="Add friends to challenge them and verify each other's check-ins."
                        actionLabel="Find people"
                        onAction={() => router.push("/friends/find")}
                    />
                ) : (
                    data!.friends.map((friend) => {
                        const name = friend.username ?? "Unknown";
                        return (
                            <Card key={friend.friendshipId} style={styles.row}>
                                <Avatar name={name} size={44} />
                                <View style={styles.info}>
                                    <Text style={styles.name}>{name}</Text>
                                    {friend.email ? (
                                        <Text style={styles.sub} numberOfLines={1}>
                                            {friend.email}
                                        </Text>
                                    ) : null}
                                </View>
                                <Button
                                    small
                                    variant="ghost"
                                    title=""
                                    icon={<UserMinus size={18} color={colors.muted} />}
                                    loading={busyId === friend.friendshipId}
                                    onPress={() => confirmRemove(friend.friendshipId, name)}
                                    style={styles.iconButton}
                                />
                            </Card>
                        );
                    })
                )
            ) : (
                <>
                    <SectionTitle
                        title="Incoming"
                        subtitle="People who want to be your friend"
                    />
                    {data!.incoming.length === 0 ? (
                        <Text style={styles.none}>No pending requests.</Text>
                    ) : (
                        data!.incoming.map((request) => (
                            <Card key={request.friendshipId} style={styles.row}>
                                <Avatar name={request.username} size={44} />
                                <View style={styles.info}>
                                    <Text style={styles.name}>{request.username}</Text>
                                    <Text style={styles.sub}>wants to be friends</Text>
                                </View>
                                <View style={styles.actions}>
                                    <Button
                                        small
                                        title="Accept"
                                        icon={<Check size={15} color={colors.white} />}
                                        loading={busyId === request.friendshipId}
                                        onPress={() =>
                                            act(
                                                request.friendshipId,
                                                () => acceptFriendRequest(request.friendshipId),
                                                "Couldn't accept"
                                            )
                                        }
                                    />
                                    <Button
                                        small
                                        variant="secondary"
                                        title=""
                                        icon={<X size={16} color={colors.text} />}
                                        disabled={busyId === request.friendshipId}
                                        onPress={() =>
                                            act(
                                                request.friendshipId,
                                                () => rejectFriendRequest(request.friendshipId),
                                                "Couldn't decline"
                                            )
                                        }
                                        style={styles.iconButton}
                                    />
                                </View>
                            </Card>
                        ))
                    )}

                    <SectionTitle title="Sent" subtitle="Waiting for a response" />
                    {data!.outgoing.length === 0 ? (
                        <Text style={styles.none}>You haven't sent any requests.</Text>
                    ) : (
                        data!.outgoing.map((request) => (
                            <Card key={request.friendshipId} style={styles.row}>
                                <Avatar name={request.username} size={44} dark={false} />
                                <View style={styles.info}>
                                    <Text style={styles.name}>{request.username}</Text>
                                    <Text style={styles.sub}>Pending</Text>
                                </View>
                            </Card>
                        ))
                    )}
                </>
            )}
        </Screen>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
    info: { flex: 1 },
    name: { fontSize: 15, fontWeight: "800", color: colors.text },
    sub: { fontSize: 12, color: colors.muted, marginTop: 2 },
    actions: { flexDirection: "row", gap: 8, alignItems: "center" },
    iconButton: { paddingHorizontal: 0, width: 40 },
    none: { fontSize: 13, color: colors.muted, marginBottom: 6 },
});
