import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { registerUser } from "@/api/register";

export default function RegisterScreen() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] =
        useState(false);


    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        const cleanUsername = username.trim();
        const cleanEmail = email.trim().toLowerCase();

        if (!cleanUsername) {
            Alert.alert(
                "Missing username",
                "Please enter a username."
            );
            return;
        }

        if (cleanUsername.length < 3) {
            Alert.alert(
                "Invalid username",
                "Username must be at least 3 characters."
            );
            return;
        }

        if (!cleanEmail) {
            Alert.alert(
                "Missing email",
                "Please enter your email."
            );
            return;
        }

        if (!password) {
            Alert.alert(
                "Missing password",
                "Please create a password."
            );
            return;
        }

        if (password.length < 8) {
            Alert.alert(
                "Weak password",
                "Password must be at least 8 characters."
            );
            return;
        }

        const phoneDigits = phone.replace(/\D/g, "");

        if (
            phone.trim() &&
            (phoneDigits.length < 8 || phoneDigits.length > 15)
        ) {
            Alert.alert(
                "Invalid mobile number",
                "Enter a valid mobile number or leave it empty."
            );
            return;
        }

        try {
            setLoading(true);

            const result = await registerUser({
                username: cleanUsername,
                email: cleanEmail,
                password,
                phone: phone.trim() || undefined,
            });

            if (!result?.accessToken) {
                throw new Error(
                    "Access token missing from registration response"
                );
            }

            if (!result?.refreshToken) {
                throw new Error(
                    "Refresh token missing from registration response"
                );
            }

            if (!result?.user) {
                throw new Error(
                    "User missing from registration response"
                );
            }

            await SecureStore.setItemAsync(
                "accessToken",
                result.accessToken
            );

            await SecureStore.setItemAsync(
                "refreshToken",
                result.refreshToken
            );

            await SecureStore.setItemAsync(
                "userId",
                result.user.id
            );

            await SecureStore.setItemAsync(
                "username",
                result.user.username
            );

            // Registration successful → go directly to tabs
            router.replace("/(tabs)");
        } catch (error: any) {
            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Unable to create your account. Please try again.";

            Alert.alert(
                "Registration failed",
                message
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.screen}
            behavior={
                Platform.OS === "ios"
                    ? "padding"
                    : undefined
            }
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                automaticallyAdjustKeyboardInsets={true}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <LinearGradient
                        colors={[
                            "#020202",
                            "#252c26",
                            "#000100",
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.logo}
                    >
                        <Text style={styles.logoIcon}>
                            ⚔
                        </Text>
                    </LinearGradient>

                    <Text style={styles.brandName}>
                        Habit Battle
                    </Text>

                    <Text style={styles.title}>
                        Create account
                    </Text>

                    <Text style={styles.subtitle}>
                        Start your Habit Battle journey
                    </Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            Username
                        </Text>

                        <View style={styles.inputWrapper}>
                            <Ionicons
                                name="person-outline"
                                size={20}
                                color="#68756C"
                            />

                            <TextInput
                                value={username}
                                onChangeText={setUsername}
                                placeholder="Choose a username"
                                placeholderTextColor="#9AA39D"
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!loading}
                                style={styles.input}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            Email
                        </Text>

                        <View style={styles.inputWrapper}>
                            <Ionicons
                                name="mail-outline"
                                size={20}
                                color="#68756C"
                            />

                            <TextInput
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Enter your email"
                                placeholderTextColor="#9AA39D"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!loading}
                                style={styles.input}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            Mobile number (optional)
                        </Text>

                        <View style={styles.inputWrapper}>
                            <Ionicons
                                name="call-outline"
                                size={20}
                                color="#68756C"
                            />

                            <TextInput
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="So friends can find you"
                                placeholderTextColor="#9AA39D"
                                keyboardType="phone-pad"
                                autoCorrect={false}
                                maxLength={20}
                                editable={!loading}
                                style={styles.input}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            Password
                        </Text>

                        <View style={styles.inputWrapper}>
                            <Ionicons
                                name="lock-closed-outline"
                                size={20}
                                color="#68756C"
                            />

                            <TextInput
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Create a password"
                                placeholderTextColor="#9AA39D"
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!loading}
                                style={styles.input}
                            />

                            <Pressable
                                onPress={() =>
                                    setShowPassword(
                                        (previous) =>
                                            !previous
                                    )
                                }
                                hitSlop={10}
                                disabled={loading}
                            >
                                <Ionicons
                                    name={
                                        showPassword
                                            ? "eye-outline"
                                            : "eye-off-outline"
                                    }
                                    size={21}
                                    color="#68756C"
                                />
                            </Pressable>
                        </View>
                    </View>


                    <Pressable
                        style={[
                            styles.primaryButton,
                            loading &&
                            styles.disabledButton,
                        ]}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={[
                                "#020202",
                                "#131513",
                                "#000100",
                            ]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.buttonGradient}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <>
                                    <Text
                                        style={
                                            styles.primaryButtonText
                                        }
                                    >
                                        Create account
                                    </Text>

                                    <Ionicons
                                        name="arrow-forward"
                                        size={20}
                                        color="#FFFFFF"
                                    />
                                </>
                            )}
                        </LinearGradient>
                    </Pressable>
                </View>

                <View style={styles.switchContainer}>
                    <Text style={styles.switchText}>
                        Already have an account?
                    </Text>

                    <Pressable
                        onPress={() =>
                            router.replace(
                                "/(auth)/login"
                            )
                        }
                        disabled={loading}
                    >
                        <Text style={styles.switchLink}>
                            Login
                        </Text>
                    </Pressable>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#F2F4F1",
    },

    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 48,
        paddingBottom: 40,
        justifyContent: "center",
    },

    header: {
        alignItems: "center",
        marginBottom: 30,
    },

    logo: {
        width: 72,
        height: 72,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
        shadowColor: "#344A39",
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.22,
        shadowRadius: 15,
        elevation: 7,
    },

    logoIcon: {
        fontSize: 40,
        color: "#FFFFFF",
        fontWeight: "700",
    },

    brandName: {
        fontSize: 15,
        fontWeight: "800",
        color: "#536158",
        letterSpacing: 0.5,
        marginBottom: 10,
    },

    title: {
        fontSize: 30,
        fontWeight: "800",
        color: "#18201B",
        letterSpacing: -0.7,
    },

    subtitle: {
        marginTop: 8,
        fontSize: 15,
        color: "#707970",
        textAlign: "center",
    },

    form: {
        width: "100%",
    },

    inputGroup: {
        marginBottom: 15,
    },

    label: {
        fontSize: 14,
        fontWeight: "700",
        color: "#29312C",
        marginBottom: 8,
    },

    inputWrapper: {
        minHeight: 54,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#DCE2DC",
        borderRadius: 17,
        paddingHorizontal: 16,
        shadowColor: "#263027",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 1,
    },

    input: {
        flex: 1,
        marginLeft: 11,
        fontSize: 15,
        color: "#18201B",
        paddingVertical: 14,
    },

    primaryButton: {
        minHeight: 56,
        marginTop: 8,
        borderRadius: 17,
        overflow: "hidden",
        shadowColor: "#4D7045",
        shadowOffset: {
            width: 0,
            height: 7,
        },
        shadowOpacity: 0.22,
        shadowRadius: 12,
        elevation: 6,
    },

    buttonGradient: {
        flex: 1,
        minHeight: 56,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
    },

    disabledButton: {
        opacity: 0.7,
    },

    primaryButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "800",
    },

    switchContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 25,
        gap: 5,
    },

    switchText: {
        fontSize: 14,
        color: "#707970",
    },

    switchLink: {
        fontSize: 14,
        fontWeight: "800",
        color: "#000000",
    },
});
