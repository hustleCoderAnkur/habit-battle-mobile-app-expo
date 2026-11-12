import axios, {
    AxiosError,
    InternalAxiosRequestConfig,
} from "axios";

import {
    clearSession,
    emitSessionExpired,
    getAccessToken,
    getRefreshToken,
    saveTokens,
} from "@/services/session";

/* =========================================================
   BASE URL
========================================================= */

const configuredBaseURL = process.env.EXPO_PUBLIC_API_URL?.trim();

if (!configuredBaseURL) {
    throw new Error("EXPO_PUBLIC_API_URL is not configured.");
}

const baseURL = configuredBaseURL.endsWith("/api")
    ? configuredBaseURL
    : `${configuredBaseURL.replace(/\/+$/, "")}/api`;

/* =========================================================
   AXIOS INSTANCE
========================================================= */

export const api = axios.create({
    baseURL,
    headers: { "Content-Type": "application/json" },
    timeout: 15000,
});

/* =========================================================
   REQUEST: attach access token
========================================================= */

api.interceptors.request.use(async (config) => {
    try {
        const accessToken = await getAccessToken();
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
    } catch {
        // ignore SecureStore errors
    }
    return config;
});

/* =========================================================
   RESPONSE: refresh the access token once on 401
   (single-flight so parallel requests share one refresh)
========================================================= */

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
    try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) return null;

        // bare axios on purpose: no interceptors, no loops
        const response = await axios.post(
            `${baseURL}/auth/refresh`,
            { refreshToken },
            { timeout: 15000 }
        );

        const data = response.data?.data;
        if (!data?.accessToken || !data?.refreshToken) return null;

        await saveTokens(data.accessToken, data.refreshToken);
        return data.accessToken as string;
    } catch {
        return null;
    }
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const original = error.config as RetriableConfig | undefined;
        const isAuthCall = original?.url?.startsWith("/auth/");

        if (
            error.response?.status === 401 &&
            original &&
            !original._retry &&
            !isAuthCall
        ) {
            original._retry = true;

            refreshPromise ??= refreshAccessToken().finally(() => {
                refreshPromise = null;
            });

            const newToken = await refreshPromise;

            if (newToken) {
                original.headers.Authorization = `Bearer ${newToken}`;
                return api(original);
            }

            await clearSession();
            emitSessionExpired();
        }

        return Promise.reject(error);
    }
);

/* =========================================================
   HELPERS
========================================================= */

export interface ApiEnvelope<T> {
    success: boolean;
    message?: string;
    data: T;
}

export function getErrorMessage(
    error: unknown,
    fallback = "Something went wrong. Please try again."
): string {
    const err = error as AxiosError<{ message?: string }>;

    if (err?.response?.data?.message) return err.response.data.message;
    if (err?.code === "ECONNABORTED") return "Request timed out. Please try again.";
    if (err?.isAxiosError && !err.response) {
        return "Can't reach the server. Check your internet connection.";
    }
    if (error instanceof Error && error.message) return error.message;
    return fallback;
}
