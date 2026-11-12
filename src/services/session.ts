import * as SecureStore from "expo-secure-store";

const ACCESS = "accessToken";
const REFRESH = "refreshToken";
const USER_ID = "userId";
const USERNAME = "username";

export const getAccessToken = () => SecureStore.getItemAsync(ACCESS);
export const getRefreshToken = () => SecureStore.getItemAsync(REFRESH);
export const getStoredUserId = () => SecureStore.getItemAsync(USER_ID);
export const getStoredUsername = () => SecureStore.getItemAsync(USERNAME);

export async function saveTokens(accessToken: string, refreshToken: string) {
    await SecureStore.setItemAsync(ACCESS, accessToken);
    await SecureStore.setItemAsync(REFRESH, refreshToken);
}

export async function clearSession() {
    await Promise.all(
        [ACCESS, REFRESH, USER_ID, USERNAME].map((key) =>
            SecureStore.deleteItemAsync(key).catch(() => undefined)
        )
    );
}

/* Session-expired event: api.ts emits it, root layout redirects to login */

type Listener = () => void;
const listeners = new Set<Listener>();

export function onSessionExpired(listener: Listener) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function emitSessionExpired() {
    listeners.forEach((listener) => listener());
}
