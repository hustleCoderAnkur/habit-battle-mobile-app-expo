import * as SecureStore from "expo-secure-store";

import { api } from "@/services/api";

/* =========================================================
   TYPES
========================================================= */

export interface LoginUser {
    email: string;
    password: string;
}

/* =========================================================
   LOGIN
   ========================================================= */


export async function loginUser(
    data: LoginUser
) {

    try {

        const response = await api.post(
            "/auth/login",
            {
                email: data.email,
                password: data.password,
            }
        );


        const result =
            response.data?.data;


        /* =================================================
           SAVE ACCESS TOKEN
        ================================================= */

        if (!result?.accessToken) {

            throw new Error(
                "Access token missing from login response"
            );
        }

        await SecureStore.setItemAsync(
            "accessToken",
            result.accessToken
        );

        /* =================================================
           SAVE REFRESH TOKEN
        ================================================= */

        if (!result?.refreshToken) {
            throw new Error(
                "Refresh token missing from login response"
            );
        }

        await SecureStore.setItemAsync(
            "refreshToken",
            result.refreshToken
        );

        return result;
    } catch (error: any) {

        throw error;
    }
}