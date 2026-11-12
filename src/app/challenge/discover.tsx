import { router } from "expo-router";
import { Search } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, TextInput, View } from "react-native";

import { getMyChallenges, joinChallenge, listChallenges } from "@/api/challenges";
import { ChallengeCard } from "@/components/challenge";
import {
    Button,
    EmptyState,
    ErrorState,
    LoadingState,
    Screen,
    ScreenHeader,
} from "@/components/ui";
import { colors, radius } from "@/constants/theme";
import { useApi } from "@/hooks/useApi";
import { getErrorMessage } from "@/services/api";
import { effectiveStatus } from "@/utils/challenge";

export default function DiscoverScreen() {
    const [query, setQuery] = useState("");
    const [debounced, setDebounced] = useState("");
    const [joiningId, setJoiningId] = useState<string | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(query.trim()), 350);
        return () => clearTimeout(timer);
    }, [query]);

    const { data, loading, error, refreshing, refresh, reload, silentReload } = useApi(
        async () => {
            const [all, mine] = await Promise.all([
                listChallenges({ search: debounced || undefined, limit: 50 }),
                getMyChallenges(),
            ]);
            return {
                joined: new Set(mine.map((c) => c.id)),
                open: all.filter((c) => {
                    const status = effectiveStatus(c);
                    return status === "ACTIVE" || status === "UPCOMING";
                }),
            };
        },
        [debounced]
    );

    const join = async (id: string) => {
        try {
            setJoiningId(id);
            await joinChallenge(id);
            router.push(`/challenge/${id}`);
            silentReload();
        } catch (e) {
            Alert.alert("Couldn't join", getErrorMessage(e));
        } finally {
            setJoiningId(null);
        }
    };

    return (
        <Screen bottomInset refreshing={refreshing} onRefresh={refresh}>
            <ScreenHeader
                title="Discover"
                subtitle="Find a challenge and join the battle"
                back
            />

            <View style={styles.searchBox}>
                <Search size={18} color={colors.muted} />
                <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search challenges"
                    placeholderTextColor="#aaaaaa"
                    style={styles.searchInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={100}
                />
            </View>

            {loading && !data ? (
                <LoadingState />
            ) : error && !data ? (
                <ErrorState message={error} onRetry={reload} />
            ) : (data?.open ?? []).length === 0 ? (
                <EmptyState
                    title={debounced ? "No matches" : "No open challenges"}
                    message={
                        debounced
                            ? "Try a different search."
                            : "Be the first — create a challenge and invite your friends."
                    }
                    actionLabel={debounced ? undefined : "Create challenge"}
                    onAction={() => router.push("/challenge/create")}
                />
            ) : (
                data!.open.map((challenge) => {
                    const isMember = data!.joined.has(challenge.id);
                    return (
                        <View key={challenge.id}>
                            <ChallengeCard
                                challenge={challenge}
                                onPress={() => router.push(`/challenge/${challenge.id}`)}
                            />
                            {!isMember && (
                                <Button
                                    title="Join challenge"
                                    small
                                    loading={joiningId === challenge.id}
                                    onPress={() => join(challenge.id)}
                                    style={styles.joinButton}
                                />
                            )}
                            {isMember && <View style={{ height: 4 }} />}
                        </View>
                    );
                })
            )}
        </Screen>
    );
}

const styles = StyleSheet.create({
    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        height: 50,
        paddingHorizontal: 14,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surfaceSoft,
        marginBottom: 16,
    },
    searchInput: { flex: 1, fontSize: 15, color: colors.text },
    joinButton: { marginTop: -2, marginBottom: 16 },
});
