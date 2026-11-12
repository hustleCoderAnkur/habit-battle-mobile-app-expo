import { api } from "@/services/api";

/** POST /api/devices/push-token */
export async function registerPushToken(input: {
    pushToken: string;
    platform: "IOS" | "ANDROID" | "WEB";
    deviceName?: string;
}): Promise<void> {
    await api.post("/devices/push-token", input);
}
