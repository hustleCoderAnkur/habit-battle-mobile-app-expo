import { router, useLocalSearchParams } from "expo-router";
import { CheckCircle2 } from "lucide-react-native";
import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";

import { createCheckIn } from "@/api/checkIns";
import { Button, Card, Field, Screen, ScreenHeader } from "@/components/ui";
import { colors } from "@/constants/theme";
import { getErrorMessage } from "@/services/api";
import { formatDate, toCheckInDateISO } from "@/utils/challenge";

export default function CheckInScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const submit = async () => {
        try {
            setSubmitting(true);
            await createCheckIn(id, {
                checkInDate: toCheckInDateISO(),
                note: note.trim() || undefined,
            });
            router.back();
        } catch (e) {
            Alert.alert("Couldn't check in", getErrorMessage(e));
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
                <ScreenHeader title="Check in" subtitle={formatDate(new Date().toISOString())} back />

                <Card style={styles.info}>
                    <CheckCircle2 size={22} color={colors.text} />
                    <Text style={styles.infoText}>
                        You earn points for checking in. A friend in this challenge then
                        verifies it for a bonus.
                    </Text>
                </Card>

                <View style={{ height: 20 }} />

                <Field
                    label="NOTE (OPTIONAL)"
                    value={note}
                    onChangeText={setNote}
                    placeholder="What did you do today?"
                    multiline
                    maxLength={1000}
                    hint="Your friends see this when they verify."
                />

                <Button title="Submit check-in" onPress={submit} loading={submitting} />
            </Screen>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    info: { flexDirection: "row", gap: 12, alignItems: "flex-start", backgroundColor: colors.surfaceSoft },
    infoText: { flex: 1, fontSize: 13, lineHeight: 19, color: colors.textSoft },
});
