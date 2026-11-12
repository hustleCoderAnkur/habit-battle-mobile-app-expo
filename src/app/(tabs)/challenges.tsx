import { router } from "expo-router";
import { Flame, Plus, Search } from "lucide-react-native";
import React, { useState } from "react";
import { View } from "react-native";

import { getMyChallenges } from "@/api/challenges";
import { ChallengeCard } from "@/components/challenge";
import {
    Button,
    EmptyState,
    ErrorState,
    LoadingState,
    Screen,
    ScreenHeader,
    Segmented,
} from "@/components/ui";
import { colors } from "@/constants/theme";
import { useApi } from "@/hooks/useApi";
import { effectiveStatus } from "@/utils/challenge";

type Tab = "ACTIVE" | "UPCOMING" | "DONE";

const EMPTY: Record<Tab, { title: string; message: string }> = {
    ACTIVE: {
        title: "No active challenges",
        message: "Join a challenge or start your own to begin your streak.",
    },
    UPCOMING: {
        title: "Nothing coming up",
        message: "Challenges that haven't started yet will show here.",
    },
    DONE: {
        title: "No finished challenges",
        message: "Completed and cancelled challenges end up here.",
    },
};

export default function ChallengesScreen() {
    const { data, loading, error, refreshing, refresh, reload } =
        useApi(getMyChallenges);
    const [tab, setTab] = useState<Tab>("ACTIVE");

    const list = (data ?? []).filter((c) => {
        const status = effectiveStatus(c);
        if (tab === "ACTIVE") return status === "ACTIVE";
        if (tab === "UPCOMING") return status === "UPCOMING";
        return status === "COMPLETED" || status === "CANCELLED";
    });

    return (
        <Screen refreshing={refreshing} onRefresh={refresh}>
            <ScreenHeader
                title="Challenges"
                subtitle="Your battles, all in one place"
            />

            <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
                <Button
                    title="Create"
                    small
                    icon={<Plus size={16} color={colors.white} />}
                    onPress={() => router.push("/challenge/create")}
                    style={{ flex: 1 }}
                />
                <Button
                    title="Discover"
                    small
                    variant="secondary"
                    icon={<Search size={16} color={colors.text} />}
                    onPress={() => router.push("/challenge/discover")}
                    style={{ flex: 1 }}
                />
            </View>

            <Segmented
                value={tab}
                onChange={setTab}
                options={[
                    { label: "Active", value: "ACTIVE" },
                    { label: "Upcoming", value: "UPCOMING" },
                    { label: "Done", value: "DONE" },
                ]}
            />

            <View style={{ height: 16 }} />

            {loading && !data ? (
                <LoadingState />
            ) : error && !data ? (
                <ErrorState message={error} onRetry={reload} />
            ) : list.length === 0 ? (
                <EmptyState
                    icon={<Flame size={24} color={colors.textSoft} />}
                    title={EMPTY[tab].title}
                    message={EMPTY[tab].message}
                    actionLabel={tab === "ACTIVE" ? "Discover challenges" : undefined}
                    onAction={() => router.push("/challenge/discover")}
                />
            ) : (
                list.map((challenge) => (
                    <ChallengeCard
                        key={challenge.id}
                        challenge={challenge}
                        onPress={() => router.push(`/challenge/${challenge.id}`)}
                    />
                ))
            )}
        </Screen>
    );
}
