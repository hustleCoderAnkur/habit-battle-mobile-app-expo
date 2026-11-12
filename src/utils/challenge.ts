import type { Challenge, ChallengeStatus } from "@/api/types";

const DAY = 24 * 60 * 60 * 1000;

function utcDayStart(value: string | Date): number {
    const d = new Date(value);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** The backend never flips UPCOMING -> ACTIVE -> COMPLETED on its own,
 *  so we derive the real state from dates (CANCELLED is respected). */
export function effectiveStatus(
    c: Pick<Challenge, "status" | "startDate" | "endDate">
): ChallengeStatus {
    if (c.status === "CANCELLED" || c.status === "COMPLETED") return c.status;
    const today = utcDayStart(new Date());
    if (today < utcDayStart(c.startDate)) return "UPCOMING";
    if (today > utcDayStart(c.endDate)) return "COMPLETED";
    return "ACTIVE";
}

export function totalDays(c: Pick<Challenge, "startDate" | "endDate">): number {
    return Math.max(
        1,
        Math.round((utcDayStart(c.endDate) - utcDayStart(c.startDate)) / DAY) + 1
    );
}

/** 0..total — how many days of the challenge have passed (incl. today) */
export function elapsedDays(c: Pick<Challenge, "startDate" | "endDate">): number {
    const total = totalDays(c);
    const elapsed =
        Math.round((utcDayStart(new Date()) - utcDayStart(c.startDate)) / DAY) + 1;
    return Math.min(total, Math.max(0, elapsed));
}

export function daysUntilStart(c: Pick<Challenge, "startDate">): number {
    return Math.max(
        0,
        Math.round((utcDayStart(c.startDate) - utcDayStart(new Date())) / DAY)
    );
}

/** The backend uses UTC calendar days for check-ins. */
export function todayKey(): string {
    return new Date().toISOString().slice(0, 10);
}

export function dayKey(value: string): string {
    return new Date(value).toISOString().slice(0, 10);
}

export function toCheckInDateISO(): string {
    return new Date().toISOString();
}

export function formatDate(value: string): string {
    return new Date(value).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
    });
}

export function formatRange(c: Pick<Challenge, "startDate" | "endDate">): string {
    return `${formatDate(c.startDate)} – ${formatDate(c.endDate)}`;
}

export function timeAgo(value: string): string {
    const diff = Date.now() - new Date(value).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return formatDate(value);
}

export function initial(name?: string | null): string {
    return (name?.trim()?.[0] ?? "?").toUpperCase();
}
