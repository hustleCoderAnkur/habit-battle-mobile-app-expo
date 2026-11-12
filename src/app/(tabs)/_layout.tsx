import { Redirect, Tabs } from "expo-router";
import { House, Trophy, User, Users } from "lucide-react-native";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { colors } from "@/constants/theme";
import { getAccessToken } from "@/services/session";

export default function TabsLayout() {
    const [auth, setAuth] = useState<"checking" | "yes" | "no">("checking");

    // Auth guard: no token -> login
    useEffect(() => {
        getAccessToken()
            .then((token) => setAuth(token ? "yes" : "no"))
            .catch(() => setAuth("no"));
    }, []);

    if (auth === "checking") {
        return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
    }

    if (auth === "no") {
        return <Redirect href="/(auth)/login" />;
    }

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.text,
                tabBarInactiveTintColor: "#9ca3af",
                tabBarStyle: {
                    height: 72,
                    paddingTop: 8,
                    paddingBottom: 10,
                    backgroundColor: colors.bg,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                },
                tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color, size }) => <House size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="challenges"
                options={{
                    title: "Challenges",
                    tabBarIcon: ({ color, size }) => <Trophy size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="friends"
                options={{
                    title: "Friends",
                    tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
                }}
            />

            {/* Not bottom tabs: reachable via router.push */}
            <Tabs.Screen name="leaderboard" options={{ href: null }} />
            <Tabs.Screen name="notifications" options={{ href: null }} />
        </Tabs>
    );
}
