import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { getErrorMessage } from "@/services/api";

interface Options {
    /** re-fetch every time the screen gains focus (default true) */
    refetchOnFocus?: boolean;
    /** skip fetching until true */
    enabled?: boolean;
}

/**
 * Tiny data hook: loading / refreshing / error / data.
 * Refetches on screen focus and whenever `deps` change.
 */
export function useApi<T>(
    fetcher: () => Promise<T>,
    deps: unknown[] = [],
    { refetchOnFocus = true, enabled = true }: Options = {}
) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(enabled);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetcherRef = useRef(fetcher);
    fetcherRef.current = fetcher;

    const requestId = useRef(0);
    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    const run = useCallback(async (mode: "initial" | "silent" | "pull") => {
        const id = ++requestId.current;
        if (mode === "initial") setLoading(true);
        if (mode === "pull") setRefreshing(true);

        try {
            const result = await fetcherRef.current();
            if (!mounted.current || id !== requestId.current) return;
            setData(result);
            setError(null);
        } catch (e) {
            if (!mounted.current || id !== requestId.current) return;
            setError(getErrorMessage(e));
        } finally {
            if (mounted.current && id === requestId.current) {
                setLoading(false);
                setRefreshing(false);
            }
        }
    }, []);

    const hasLoaded = useRef(false);

    useEffect(() => {
        if (!enabled) return;
        hasLoaded.current = true;
        run("initial");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, ...deps]);

    useFocusEffect(
        useCallback(() => {
            if (refetchOnFocus && enabled && hasLoaded.current) {
                run("silent");
            }
        }, [refetchOnFocus, enabled, run])
    );

    return {
        data,
        loading,
        refreshing,
        error,
        refresh: () => run("pull"),
        reload: () => run("initial"),
        silentReload: () => run("silent"),
        setData,
    };
}
