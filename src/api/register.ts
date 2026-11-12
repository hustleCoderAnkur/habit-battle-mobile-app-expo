
import { api } from "@/services/api";

/* =========================================================
   TYPES
========================================================= */

export interface RegisterInput {
    username: string;
    email: string;
    password: string;
    phone?: string;
}
export interface RegisterUser {
    id: string;
    email: string;
    username: string;
    role: "USER" | "ADMIN" | "SUPER_ADMIN";
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}

export interface RegisterResponse {
    user: RegisterUser;
    accessToken: string;
    refreshToken: string;
}

/* =========================================================
   REGISTER
   POST /api/auth/register
========================================================= */

export async function registerUser(
    data: RegisterInput
): Promise<RegisterResponse> {
    const response = await api.post(
        "/auth/register",
        data
    );

    console.log(
        "REGISTER API RESPONSE:",
        response.data
    );

    const result = response.data?.data;

    if (!result) {
        throw new Error(
            "Invalid register response from server."
        );
    }

    if (
        !result.accessToken ||
        !result.refreshToken ||
        !result.user
    ) {
        throw new Error(
            "Register response is missing authentication data."
        );
    }

    return result;
}
