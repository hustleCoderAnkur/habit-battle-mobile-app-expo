import { api } from "@/services/api";
import { clearSession, getRefreshToken } from "@/services/session";

/**
 * POST /api/auth/logout  { refreshToken }
 * Always clears the local session, even if the server call fails.
 */
export async function logoutUser(): Promise<void> {
    try {
        const refreshToken = await getRefreshToken();
        if (refreshToken) {
            await api.post("/auth/logout", { refreshToken });
        }
    } catch {
        // ignore: we still want to log out locally
    } finally {
        await clearSession();
    }
}
