import * as Notifications from "expo-notifications";
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

import { configureNotifications } from "@/services/notifications";
import { onSessionExpired } from "@/services/session";

configureNotifications();

export default function RootLayout() {
    // Refresh token failed -> send the user back to login
    useEffect(() => {
        return onSessionExpired(() => {
            router.replace("/(auth)/login");
        });
    }, []);

    // Tapping a push notification opens the notifications screen
    useEffect(() => {
        const subscription =
            Notifications.addNotificationResponseReceivedListener(() => {
                router.push("/(tabs)/notifications");
            });
        return () => subscription.remove();
    }, []);

    return (
        <>
            <StatusBar style="dark" />

            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="splash" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="challenge/create" />
                <Stack.Screen name="challenge/discover" />
                <Stack.Screen name="challenge/explore" />
                <Stack.Screen name="challenge/[id]/index" />
                <Stack.Screen
                    name="challenge/[id]/check-in"
                    options={{ presentation: "modal" }}
                />
                <Stack.Screen name="challenge/[id]/invite" />
                <Stack.Screen name="friends/find" />
                <Stack.Screen name="profile/edit" />
                <Stack.Screen name="settings/notifications" />
            </Stack>
        </>
    );
}
