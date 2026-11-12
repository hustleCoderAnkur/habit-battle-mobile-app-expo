export type ChallengeStatus = "UPCOMING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
export type MemberRole = "OWNER" | "ADMIN" | "MEMBER";
export type MemberStatus = "ACTIVE" | "LEFT" | "REMOVED" | string;
export type CheckInStatus = "PENDING" | "VERIFIED" | "REJECTED";
export type InviteStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";

export type NotificationType =
    | "FRIEND_REQUEST"
    | "FRIEND_ACCEPTED"
    | "CHALLENGE_INVITE"
    | "CHALLENGE_JOINED"
    | "CHECK_IN_VERIFICATION"
    | "CHECK_IN_VERIFIED"
    | "CHECK_IN_REJECTED"
    | "STREAK_MILESTONE"
    | "CHALLENGE_COMPLETED"
    | "SYSTEM";

export interface Me {
    id: string;
    email: string;
    username: string;
    phone: string | null;
    role: "USER" | "ADMIN" | "SUPER_ADMIN";
    status: string;
    profileId: string | null;
    name: string | null;
    bio: string | null;
    avatarUrl: string | null;
    totalPoints: number | null;
    currentStreak: number | null;
    longestStreak: number | null;
}

export interface Profile {
    id: string;
    userId: string;
    name: string | null;
    bio: string | null;
    avatarUrl: string | null;
    totalPoints: number;
    currentStreak: number;
    longestStreak: number;
}

export interface UserSearchResult {
    id: string;
    username: string;
    name: string | null;
    avatarUrl: string | null;
}

export interface Challenge {
    id: string;
    name: string;
    description: string | null;
    createdBy: string;
    startDate: string;
    endDate: string;
    maxMembers: number | null;
    status: ChallengeStatus;
    createdAt: string;
}

export interface MyChallenge extends Challenge {
    memberRole: MemberRole;
    memberStatus: MemberStatus;
    points: number;
    currentStreak: number;
}

export interface ChallengeMember {
    membershipId: string;
    userId: string;
    username: string;
    email: string;
    role: MemberRole;
    status: MemberStatus;
    points: number;
    currentStreak: number;
    longestStreak: number;
    joinedAt: string;
}

export interface CreateChallengeInput {
    name: string;
    description?: string;
    startDate: string; // ISO
    endDate: string; // ISO
    maxMembers?: number;
}

export interface CheckIn {
    id: string;
    challengeId: string;
    userId: string;
    username: string;
    uploadId: string | null;
    checkInDate: string;
    note: string | null;
    status: CheckInStatus;
    pointsAwarded: number;
    verifiedBy: string | null;
    verifiedAt: string | null;
    createdAt: string;
}

export interface CheckInStats {
    total: number;
    pending: number;
    verified: number;
    rejected: number;
    totalPoints: number;
}

export interface Friend {
    friendshipId: string;
    userId: string;
    username: string | null;
    email: string | null;
    status: string;
    createdAt: string;
}

export interface FriendRequest {
    friendshipId: string;
    userId: string;
    username: string;
    email: string;
    createdAt: string;
}

export interface AppNotification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    data: string | null;
    isRead: boolean;
    readAt: string | null;
    createdAt: string;
}

export interface NotificationPreferences {
    friendRequests: boolean;
    challengeInvites: boolean;
    checkIns: boolean;
    streaks: boolean;
    system: boolean;
    pushEnabled: boolean;
}

export interface ChallengeInvite {
    id: string;
    challengeId: string;
    senderId: string;
    senderUsername?: string;
    receiverId?: string;
    status: InviteStatus;
    expiresAt: string | null;
    createdAt: string;
}

export type Relationship = "FRIEND" | "REQUEST_SENT" | "REQUEST_RECEIVED" | "NONE";

/** A registered user found by email / phone / contacts */
export interface PersonMatch {
    id: string;
    username: string;
    name: string | null;
    avatarUrl: string | null;
    relationship: Relationship;
}

/** match-contacts result: which of the sent emails / phone keys matched */
export interface ContactMatch extends PersonMatch {
    matchedEmails: string[];
    matchedPhoneKeys: string[];
}
