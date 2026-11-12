import * as SecureStore from "expo-secure-store";
import { Redirect } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    Animated,
    Easing,
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function SplashScreen() {
    const [isReady, setIsReady] = useState(false);
    const [hasToken, setHasToken] = useState(false);

    // =========================================================
    // ANIMATIONS
    // =========================================================

    const logoScale = useRef(
        new Animated.Value(0.75)
    ).current;

    const logoOpacity = useRef(
        new Animated.Value(0)
    ).current;

    const taglineOpacity = useRef(
        new Animated.Value(0)
    ).current;

    const loaderOpacity = useRef(
        new Animated.Value(0)
    ).current;

    // Single loading line animation
    const loaderTranslateX = useRef(
        new Animated.Value(80)
    ).current;

    // =========================================================
    // SPLASH
    // =========================================================

    useEffect(() => {
        let mounted = true;

        async function initialize() {
            const startTime = Date.now();

            // -------------------------------------------------
            // Check authentication
            // -------------------------------------------------

            try {
                const accessToken =
                    await SecureStore.getItemAsync(
                        "accessToken"
                    );

                if (mounted) {
                    setHasToken(Boolean(accessToken));
                }
            } catch (error) {
                console.error(
                    "Failed to check authentication:",
                    error
                );

                if (mounted) {
                    setHasToken(false);
                }
            }

            // -------------------------------------------------
            // Logo animation
            // -------------------------------------------------

            Animated.sequence([
                Animated.parallel([
                    Animated.timing(
                        logoOpacity,
                        {
                            toValue: 1,
                            duration: 600,
                            easing: Easing.out(
                                Easing.cubic
                            ),
                            useNativeDriver: true,
                        }
                    ),

                    Animated.spring(
                        logoScale,
                        {
                            toValue: 1,
                            friction: 7,
                            tension: 45,
                            useNativeDriver: true,
                        }
                    ),
                ]),

                Animated.timing(
                    taglineOpacity,
                    {
                        toValue: 1,
                        duration: 450,
                        easing: Easing.out(
                            Easing.cubic
                        ),
                        useNativeDriver: true,
                    }
                ),

                Animated.timing(
                    loaderOpacity,
                    {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }
                ),
            ]).start();

            // -------------------------------------------------
            // Single loading line animation
            // -------------------------------------------------

            Animated.loop(
                Animated.sequence([
                    Animated.timing(
                        loaderTranslateX,
                        {
                            toValue: 40,
                            duration: 800,
                            easing: Easing.inOut(
                                Easing.ease
                            ),
                            useNativeDriver: true,
                        }
                    ),

                    Animated.timing(
                        loaderTranslateX,
                        {
                            toValue: -40,
                            duration: 800,
                            easing: Easing.inOut(
                                Easing.ease
                            ),
                            useNativeDriver: true,
                        }
                    ),
                ])
            ).start();

            // -------------------------------------------------
            // Keep splash visible for at least 1.8 seconds
            // -------------------------------------------------

            const elapsed =
                Date.now() - startTime;

            const remaining = Math.max(
                0,
                1800 - elapsed
            );

            setTimeout(() => {
                if (mounted) {
                    setIsReady(true);
                }
            }, remaining);
        }

        initialize();

        return () => {
            mounted = false;
        };
    }, []);

    // =========================================================
    // NAVIGATION
    // =========================================================

    if (isReady) {
        if (hasToken) {
            return <Redirect href="/(tabs)" />;
        }

        return (
            <Redirect href="/(auth)/login" />
        );
    }

    // =========================================================
    // UI
    // =========================================================

    return (
        <View style={styles.container}>
            <View style={styles.centerContent}>
                <Animated.View
                    style={[
                        styles.logoWrapper,
                        {
                            opacity: logoOpacity,
                            transform: [
                                {
                                    scale: logoScale,
                                },
                            ],
                        },
                    ]}
                >
                    <View style={styles.logoCircle}>
                        <Text style={styles.logoIcon}>
                            ⚔
                        </Text>
                    </View>

                    <Text style={styles.logo}>
                        Habit Battle
                    </Text>
                </Animated.View>

                <Animated.Text
                    style={[
                        styles.tagline,
                        {
                            opacity:
                                taglineOpacity,
                        },
                    ]}
                >
                    Build habits. Battle together.
                </Animated.Text>
            </View>

            {/* =================================================
                SINGLE LINE LOADER
            ================================================= */}

            <Animated.View
                style={[
                    styles.loader,
                    {
                        opacity: loaderOpacity,
                    },
                ]}
            >
                <View style={styles.loaderTrack}>
                    <Animated.View
                        style={[
                            styles.loaderLine,
                            {
                                transform: [
                                    {
                                        translateX:
                                            loaderTranslateX,
                                    },
                                ],
                            },
                        ]}
                    />
                </View>
            </Animated.View>
        </View>
    );
}

// =========================================================
// STYLES
// =========================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#ffffff",

        alignItems: "center",
        justifyContent: "center",
    },

    centerContent: {
        alignItems: "center",
        justifyContent: "center",
    },

    logoWrapper: {
        alignItems: "center",
        justifyContent: "center",
    },

    logoCircle: {
        width: 82,
        height: 82,

        borderRadius: 41,

        alignItems: "center",
        justifyContent: "center",

        backgroundColor: "#111827",

        marginBottom: 18,

        shadowColor: "#000000",
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.15,
        shadowRadius: 12,

        elevation: 8,
    },

    logoIcon: {
        fontSize: 38,
        color: "#ffffff",
    },

    logo: {
        fontSize: 32,
        fontWeight: "800",

        letterSpacing: -0.8,

        color: "#111827",
    },

    tagline: {
        marginTop: 10,

        fontSize: 14,
        fontWeight: "500",

        color: "#6b7280",

        letterSpacing: 0.2,
    },

    // =========================================================
    // LOADER
    // =========================================================

    loader: {
        position: "absolute",

        bottom: 70,

        alignItems: "center",
        justifyContent: "center",
    },

    loaderTrack: {
        width: 80,
        height: 3,

        borderRadius: 2,

        overflow: "hidden",

        backgroundColor: "#e5e7eb",
    },

    loaderLine: {
        width: 40,
        height: 3,

        borderRadius: 2,

        backgroundColor: "#111827",
    },
});