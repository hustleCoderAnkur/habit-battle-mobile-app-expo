import { router } from "expo-router";
import { ArrowLeft, CircleAlert, Inbox } from "lucide-react-native";
import React from "react";
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleProp,
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    View,
    ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, radius } from "@/constants/theme";
import { initial } from "@/utils/challenge";

/* =========================================================
   SCREEN + HEADER
========================================================= */

interface ScreenProps {
    children: React.ReactNode;
    /** scrollable by default */
    scroll?: boolean;
    refreshing?: boolean;
    onRefresh?: () => void;
    /** include bottom safe-area (use on screens outside the tab bar) */
    bottomInset?: boolean;
    contentStyle?: StyleProp<ViewStyle>;
    footer?: React.ReactNode;
}

export function Screen({
    children,
    scroll = true,
    refreshing,
    onRefresh,
    bottomInset = false,
    contentStyle,
    footer,
}: ScreenProps) {
    return (
        <SafeAreaView
            style={styles.screen}
            edges={bottomInset ? ["top", "bottom"] : ["top"]}
        >
            {scroll ? (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={[styles.content, contentStyle]}
                    refreshControl={
                        onRefresh ? (
                            <RefreshControl
                                refreshing={Boolean(refreshing)}
                                onRefresh={onRefresh}
                                tintColor={colors.text}
                            />
                        ) : undefined
                    }
                >
                    {children}
                </ScrollView>
            ) : (
                <View style={[styles.content, styles.flex, contentStyle]}>
                    {children}
                </View>
            )}
            {footer}
        </SafeAreaView>
    );
}

interface ScreenHeaderProps {
    title: string;
    subtitle?: string;
    /** shows a back arrow (stack screens) */
    back?: boolean;
    right?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, back, right }: ScreenHeaderProps) {
    return (
        <View style={styles.header}>
            {back && (
                <Pressable
                    onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))}
                    style={styles.backButton}
                    hitSlop={8}
                    accessibilityLabel="Go back"
                >
                    <ArrowLeft size={20} color={colors.text} />
                </Pressable>
            )}
            <View style={styles.flex}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {title}
                </Text>
                {subtitle ? (
                    <Text style={styles.headerSubtitle} numberOfLines={2}>
                        {subtitle}
                    </Text>
                ) : null}
            </View>
            {right}
        </View>
    );
}

/* =========================================================
   SECTION TITLE
========================================================= */

export function SectionTitle({
    title,
    subtitle,
    actionLabel,
    onAction,
}: {
    title: string;
    subtitle?: string;
    actionLabel?: string;
    onAction?: () => void;
}) {
    return (
        <View style={styles.sectionRow}>
            <View style={styles.flex}>
                <Text style={styles.sectionTitle}>{title}</Text>
                {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
            </View>
            {actionLabel && onAction ? (
                <Pressable onPress={onAction} hitSlop={8}>
                    <Text style={styles.sectionAction}>{actionLabel}</Text>
                </Pressable>
            ) : null}
        </View>
    );
}

/* =========================================================
   CARD / BUTTON / BADGE
========================================================= */

export function Card({
    children,
    onPress,
    style,
}: {
    children: React.ReactNode;
    onPress?: () => void;
    style?: StyleProp<ViewStyle>;
}) {
    if (onPress) {
        return (
            <Pressable
                onPress={onPress}
                style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}
            >
                {children}
            </Pressable>
        );
    }
    return <View style={[styles.card, style]}>{children}</View>;
}

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

export function Button({
    title,
    onPress,
    loading,
    disabled,
    variant = "primary",
    icon,
    small,
    style,
}: {
    title: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
    variant?: ButtonVariant;
    icon?: React.ReactNode;
    small?: boolean;
    style?: StyleProp<ViewStyle>;
}) {
    const inactive = disabled || loading;
    const textColor =
        variant === "primary"
            ? colors.white
            : variant === "danger"
              ? colors.danger
              : colors.text;

    return (
        <Pressable
            onPress={onPress}
            disabled={inactive}
            style={({ pressed }) => [
                styles.button,
                small && styles.buttonSmall,
                variant === "primary" && styles.buttonPrimary,
                variant === "secondary" && styles.buttonSecondary,
                variant === "danger" && styles.buttonDanger,
                variant === "ghost" && styles.buttonGhost,
                inactive && styles.buttonDisabled,
                pressed && styles.pressed,
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator size="small" color={textColor} />
            ) : (
                <>
                    {icon}
                    {title ? (
                        <Text
                            style={[
                                styles.buttonText,
                                small && styles.buttonTextSmall,
                                { color: textColor },
                            ]}
                        >
                            {title}
                        </Text>
                    ) : null}
                </>
            )}
        </Pressable>
    );
}

type BadgeTone = "neutral" | "success" | "warning" | "danger";

export function Badge({ label, tone = "neutral" }: { label: string; tone?: BadgeTone }) {
    const map = {
        neutral: { bg: colors.surface, fg: colors.textSoft },
        success: { bg: colors.successBg, fg: colors.success },
        warning: { bg: colors.warningBg, fg: colors.warning },
        danger: { bg: colors.dangerBg, fg: colors.danger },
    }[tone];

    return (
        <View style={[styles.badge, { backgroundColor: map.bg }]}>
            <Text style={[styles.badgeText, { color: map.fg }]}>{label}</Text>
        </View>
    );
}

/* =========================================================
   SEGMENTED / AVATAR / PROGRESS
========================================================= */

export function Segmented<T extends string>({
    options,
    value,
    onChange,
}: {
    options: { label: string; value: T }[];
    value: T;
    onChange: (value: T) => void;
}) {
    return (
        <View style={styles.segmented}>
            {options.map((option) => {
                const active = option.value === value;
                return (
                    <Pressable
                        key={option.value}
                        onPress={() => onChange(option.value)}
                        style={[styles.segment, active && styles.segmentActive]}
                    >
                        <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                            {option.label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

export function Avatar({
    name,
    size = 40,
    dark = true,
}: {
    name?: string | null;
    size?: number;
    dark?: boolean;
}) {
    return (
        <View
            style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: dark ? colors.text : colors.surface,
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <Text
                style={{
                    color: dark ? colors.white : colors.text,
                    fontWeight: "800",
                    fontSize: size * 0.38,
                }}
            >
                {initial(name)}
            </Text>
        </View>
    );
}

export function ProgressBar({ value }: { value: number }) {
    const pct = Math.max(0, Math.min(1, value)) * 100;
    return (
        <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
        </View>
    );
}

/* =========================================================
   STATES: loading / empty / error
========================================================= */

export function LoadingState({ label = "Loading…" }: { label?: string }) {
    return (
        <View style={styles.state}>
            <ActivityIndicator color={colors.text} />
            <Text style={styles.stateText}>{label}</Text>
        </View>
    );
}

export function EmptyState({
    title,
    message,
    icon,
    actionLabel,
    onAction,
}: {
    title: string;
    message?: string;
    icon?: React.ReactNode;
    actionLabel?: string;
    onAction?: () => void;
}) {
    return (
        <View style={styles.state}>
            <View style={styles.stateIcon}>
                {icon ?? <Inbox size={24} color={colors.textSoft} />}
            </View>
            <Text style={styles.stateTitle}>{title}</Text>
            {message ? <Text style={styles.stateText}>{message}</Text> : null}
            {actionLabel && onAction ? (
                <Button
                    title={actionLabel}
                    onPress={onAction}
                    small
                    style={styles.stateAction}
                />
            ) : null}
        </View>
    );
}

export function ErrorState({
    message,
    onRetry,
}: {
    message: string;
    onRetry?: () => void;
}) {
    return (
        <View style={styles.state}>
            <View style={[styles.stateIcon, { backgroundColor: colors.dangerBg }]}>
                <CircleAlert size={24} color={colors.danger} />
            </View>
            <Text style={styles.stateTitle}>Couldn't load this</Text>
            <Text style={styles.stateText}>{message}</Text>
            {onRetry ? (
                <Button
                    title="Try again"
                    variant="secondary"
                    onPress={onRetry}
                    small
                    style={styles.stateAction}
                />
            ) : null}
        </View>
    );
}

/** Small inline banner for failed background refreshes etc. */
export function InlineError({ message }: { message: string }) {
    return (
        <View style={styles.inlineError}>
            <CircleAlert size={16} color={colors.danger} />
            <Text style={styles.inlineErrorText}>{message}</Text>
        </View>
    );
}

/* =========================================================
   FORM FIELD
========================================================= */

export function Field({
    label,
    hint,
    error,
    ...props
}: TextInputProps & { label: string; hint?: string; error?: string | null }) {
    return (
        <View style={styles.field}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <TextInput
                placeholderTextColor="#aaaaaa"
                {...props}
                style={[
                    styles.input,
                    props.multiline && styles.inputMultiline,
                    error ? styles.inputError : null,
                    props.style,
                ]}
            />
            {error ? (
                <Text style={styles.fieldError}>{error}</Text>
            ) : hint ? (
                <Text style={styles.fieldHint}>{hint}</Text>
            ) : null}
        </View>
    );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
    flex: { flex: 1 },
    screen: { flex: 1, backgroundColor: colors.bg },
    content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },
    pressed: { opacity: 0.75 },

    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
        gap: 12,
    },
    backButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 28,
        lineHeight: 34,
        fontWeight: "800",
        color: colors.text,
        letterSpacing: -0.8,
    },
    headerSubtitle: { fontSize: 14, lineHeight: 20, color: colors.muted, marginTop: 2 },

    sectionRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        marginTop: 26,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 21,
        lineHeight: 26,
        fontWeight: "800",
        color: colors.text,
        letterSpacing: -0.4,
    },
    sectionSubtitle: { fontSize: 13, color: colors.muted, marginTop: 2 },
    sectionAction: { fontSize: 13, fontWeight: "700", color: colors.text, marginBottom: 2 },

    card: {
        backgroundColor: colors.bg,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.lg,
        padding: 16,
    },

    button: {
        minHeight: 50,
        borderRadius: radius.md,
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    buttonSmall: { minHeight: 40, paddingHorizontal: 16, borderRadius: radius.sm },
    buttonPrimary: { backgroundColor: colors.text },
    buttonSecondary: {
        backgroundColor: colors.bg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    buttonDanger: {
        backgroundColor: colors.dangerBg,
        borderWidth: 1,
        borderColor: "#f3d3d3",
    },
    buttonGhost: { backgroundColor: "transparent" },
    buttonDisabled: { opacity: 0.45 },
    buttonText: { fontSize: 15, fontWeight: "800" },
    buttonTextSmall: { fontSize: 13 },

    badge: {
        alignSelf: "flex-start",
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 10,
    },
    badgeText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.7 },

    segmented: {
        flexDirection: "row",
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        padding: 4,
    },
    segment: {
        flex: 1,
        paddingVertical: 10,
        alignItems: "center",
        borderRadius: radius.sm,
    },
    segmentActive: { backgroundColor: colors.bg },
    segmentText: { fontSize: 13, fontWeight: "700", color: colors.muted },
    segmentTextActive: { color: colors.text },

    progressTrack: {
        height: 6,
        borderRadius: 3,
        backgroundColor: "#eeeeec",
        overflow: "hidden",
    },
    progressFill: { height: "100%", borderRadius: 3, backgroundColor: colors.text },

    state: { alignItems: "center", paddingVertical: 48, paddingHorizontal: 24 },
    stateIcon: {
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: colors.surface,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14,
    },
    stateTitle: {
        fontSize: 17,
        fontWeight: "800",
        color: colors.text,
        textAlign: "center",
    },
    stateText: {
        fontSize: 13,
        lineHeight: 19,
        color: colors.muted,
        textAlign: "center",
        marginTop: 6,
        maxWidth: 280,
    },
    stateAction: { marginTop: 16 },

    inlineError: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: colors.dangerBg,
        borderRadius: radius.sm,
        padding: 12,
        marginBottom: 12,
    },
    inlineErrorText: { flex: 1, fontSize: 13, color: colors.danger },

    field: { marginBottom: 16 },
    fieldLabel: {
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 0.8,
        color: colors.textSoft,
        marginBottom: 7,
    },
    input: {
        minHeight: 50,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingHorizontal: 14,
        fontSize: 15,
        color: colors.text,
        backgroundColor: colors.surfaceSoft,
    },
    inputMultiline: { minHeight: 96, paddingTop: 14, textAlignVertical: "top" },
    inputError: { borderColor: colors.danger },
    fieldHint: { fontSize: 12, color: colors.muted, marginTop: 6 },
    fieldError: { fontSize: 12, color: colors.danger, marginTop: 6 },
});
