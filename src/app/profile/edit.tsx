import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform } from "react-native";

import { getMyProfile, updateMyProfile } from "@/api/profiles";
import { getMe, updateMyPhone } from "@/api/users";
import {
    Button,
    ErrorState,
    Field,
    LoadingState,
    Screen,
    ScreenHeader,
} from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { getErrorMessage } from "@/services/api";

export default function EditProfileScreen() {
    const { data, loading, error, reload } = useApi(
        async () => {
            const [profile, me] = await Promise.all([getMyProfile(), getMe()]);
            return { profile, phone: me.phone };
        },
        [],
        { refetchOnFocus: false }
    );

    const [name, setName] = useState("");
    const [bio, setBio] = useState("");
    const [phone, setPhone] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (data) {
            setName(data.profile.name ?? "");
            setBio(data.profile.bio ?? "");
            setPhone(data.phone ?? "");
        }
    }, [data]);

    const save = async () => {
        const digits = phone.replace(/\D/g, "");
        if (phone.trim() && (digits.length < 8 || digits.length > 15)) {
            Alert.alert("Invalid mobile number", "Enter a valid number or leave it empty.");
            return;
        }

        try {
            setSaving(true);

            await updateMyProfile({
                name: name.trim() || null,
                bio: bio.trim() || null,
            });

            // only touch the phone if it changed
            if (phone.trim() !== (data?.phone ?? "")) {
                await updateMyPhone(phone.trim() || null);
            }

            router.back();
        } catch (e) {
            Alert.alert("Couldn't save", getErrorMessage(e));
        } finally {
            setSaving(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <Screen bottomInset>
                <ScreenHeader title="Edit profile" back />

                {loading && !data ? (
                    <LoadingState />
                ) : error && !data ? (
                    <ErrorState message={error} onRetry={reload} />
                ) : (
                    <>
                        <Field
                            label="NAME"
                            value={name}
                            onChangeText={setName}
                            placeholder="Your name"
                            maxLength={100}
                        />
                        <Field
                            label="MOBILE NUMBER"
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="e.g. +91 98765 43210"
                            keyboardType="phone-pad"
                            maxLength={20}
                            hint="Friends can find you by this number. It's only used for matching."
                        />
                        <Field
                            label="BIO"
                            value={bio}
                            onChangeText={setBio}
                            placeholder="Tell your friends what you're working on"
                            multiline
                            maxLength={500}
                            hint={`${bio.length}/500`}
                        />
                        <Button title="Save changes" onPress={save} loading={saving} />
                    </>
                )}
            </Screen>
        </KeyboardAvoidingView>
    );
}
