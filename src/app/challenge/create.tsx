import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { createChallenge } from "@/api/challenges";
import { Button, Field, Screen, ScreenHeader } from "@/components/ui";
import { colors, radius } from "@/constants/theme";
import { getErrorMessage } from "@/services/api";
import { formatDate } from "@/utils/challenge";

const DAY = 24 * 60 * 60 * 1000;

const START_OPTIONS = [
    { label: "Today", offset: 0 },
    { label: "Tomorrow", offset: 1 },
    { label: "In 3 days", offset: 3 },
    { label: "Next week", offset: 7 },
];

const DURATION_OPTIONS = [7, 14, 21, 30, 60, 90];

/** Midnight UTC of today + offset days (the backend counts days in UTC). */
function startFor(offsetDays: number): Date {
    const now = new Date();
    return new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) +
            offsetDays * DAY
    );
}

export default function CreateChallengeScreen() {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [startOffset, setStartOffset] = useState(0);
    const [duration, setDuration] = useState(30);
    const [maxMembers, setMaxMembers] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ name?: string; maxMembers?: string }>({});

    const { startDate, endDate } = useMemo(() => {
        const start = startFor(startOffset);
        // last day included, up to its final second
        const end = new Date(start.getTime() + (duration - 1) * DAY + (DAY - 1000));
        return { startDate: start, endDate: end };
    }, [startOffset, duration]);

    const submit = async () => {
        const nextErrors: typeof errors = {};
        const cleanName = name.trim();

        if (cleanName.length < 3) nextErrors.name = "Name must be at least 3 characters.";
        if (cleanName.length > 100) nextErrors.name = "Name must be under 100 characters.";

        let max: number | undefined;
        if (maxMembers.trim()) {
            max = Number(maxMembers);
            if (!Number.isInteger(max) || max < 2 || max > 100) {
                nextErrors.maxMembers = "Enter a number between 2 and 100, or leave empty.";
            }
        }

        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        try {
            setSubmitting(true);
            const { challenge } = await createChallenge({
                name: cleanName,
                description: description.trim() || undefined,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                maxMembers: max,
            });
            router.replace(`/challenge/${challenge.id}`);
        } catch (e) {
            Alert.alert("Couldn't create challenge", getErrorMessage(e));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <Screen bottomInset>
                <ScreenHeader
                    title="New challenge"
                    subtitle="Set the rules, invite friends, start battling"
                    back
                />

                <Field
                    label="NAME"
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. 30 Days Coding"
                    maxLength={100}
                    error={errors.name}
                />

                <Field
                    label="DESCRIPTION (OPTIONAL)"
                    value={description}
                    onChangeText={setDescription}
                    placeholder="What does everyone need to do each day?"
                    multiline
                    maxLength={500}
                />

                <Text style={styles.label}>STARTS</Text>
                <View style={styles.chips}>
                    {START_OPTIONS.map((option) => (
                        <Chip
                            key={option.label}
                            label={option.label}
                            active={startOffset === option.offset}
                            onPress={() => setStartOffset(option.offset)}
                        />
                    ))}
                </View>

                <Text style={[styles.label, { marginTop: 20 }]}>DURATION</Text>
                <View style={styles.chips}>
                    {DURATION_OPTIONS.map((days) => (
                        <Chip
                            key={days}
                            label={`${days} days`}
                            active={duration === days}
                            onPress={() => setDuration(days)}
                        />
                    ))}
                </View>

                <View style={styles.summary}>
                    <Text style={styles.summaryText}>
                        {formatDate(startDate.toISOString())} →{" "}
                        {formatDate(endDate.toISOString())}
                    </Text>
                </View>

                <Field
                    label="MAX MEMBERS (OPTIONAL)"
                    value={maxMembers}
                    onChangeText={(t) => setMaxMembers(t.replace(/[^0-9]/g, ""))}
                    placeholder="No limit"
                    keyboardType="number-pad"
                    maxLength={3}
                    error={errors.maxMembers}
                />

                <Button
                    title="Create challenge"
                    onPress={submit}
                    loading={submitting}
                    style={{ marginTop: 8 }}
                />
            </Screen>
        </KeyboardAvoidingView>
    );
}

function Chip({
    label,
    active,
    onPress,
}: {
    label: string;
    active: boolean;
    onPress: () => void;
}) {
    return (
        <Pressable
            onPress={onPress}
            style={[styles.chip, active && styles.chipActive]}
        >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    label: {
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 0.8,
        color: colors.textSoft,
        marginBottom: 10,
    },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 11,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.border,
    },
    chipActive: { backgroundColor: colors.text, borderColor: colors.text },
    chipText: { fontSize: 13, fontWeight: "700", color: colors.textSoft },
    chipTextActive: { color: colors.white },
    summary: {
        marginTop: 16,
        marginBottom: 20,
        padding: 14,
        borderRadius: radius.md,
        backgroundColor: colors.surface,
    },
    summaryText: {
        fontSize: 13,
        fontWeight: "700",
        color: colors.text,
        textAlign: "center",
    },
});
