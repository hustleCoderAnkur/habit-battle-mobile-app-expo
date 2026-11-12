import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

import { getUnreadCount } from "@/api/notifications";

/** Unread notification count; refreshed every time the screen is focused. */
export function useUnreadCount() {
    const [count, setCount] = useState(0);

    const refresh = useCallback(async () => {
        try {
            setCount(await getUnreadCount());
        } catch {
            // bell badge is non-critical
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            refresh();
        }, [refresh])
    );

    return { count, refresh, setCount };
}
