import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { registerPushToken } from "@/api/devices";

/* =========================================================
   FOREGROUND BEHAVIOUR (SDK 58 handler shape)
========================================================= */

let configured = false;

export function configureNotifications() {
    if (configured) return;
    configured = true;

    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: false,
            shouldSetBadge: false,
        }),
    });

    if (Platform.OS === "android") {
        Notifications.setNotificationChannelAsync("default", {
            name: "Habit Battle",
            importance: Notifications.AndroidImportance.HIGH,
        }).catch(() => undefined);
    }
}

/* =========================================================
   PERMISSION
========================================================= */

export type PermissionResult = "granted" | "denied";

export async function getNotificationPermission(): Promise<PermissionResult> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === "granted" ? "granted" : "denied";
}

/** Asks only if not already granted. Called when the bell is tapped. */
export async function ensureNotificationPermission(): Promise<PermissionResult> {
    const current = await Notifications.getPermissionsAsync();
    if (current.status === "granted") return "granted";

    const requested = await Notifications.requestPermissionsAsync();
    return requested.status === "granted" ? "granted" : "denied";
}

/* =========================================================
   PUSH TOKEN -> BACKEND (Android push when app is closed)
========================================================= */

/**
 * Registers this device for push. Returns false (silently) when push
 * can't work yet: no permission, Expo Go on Android, or no EAS projectId.
 */
export async function registerDeviceForPush(): Promise<boolean> {
    try {
        if ((await getNotificationPermission()) !== "granted") return false;

        const projectId =
            Constants.expoConfig?.extra?.eas?.projectId ??
            Constants.easConfig?.projectId;

        if (!projectId) {
            if (__DEV__) {
                console.warn(
                    "[push] No EAS projectId found. Run `eas init` to enable push tokens."
                );
            }
            return false;
        }

        const token = await Notifications.getExpoPushTokenAsync({ projectId });

        await registerPushToken({
            pushToken: token.data,
            platform: Platform.OS === "ios" ? "IOS" : "ANDROID",
            deviceName: Constants.deviceName ?? undefined,
        });
        return true;
    } catch (error) {
        if (__DEV__) console.warn("[push] registration failed:", error);
        return false;
    }
}
