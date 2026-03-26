
export interface ReferralResponse {
    walletAddress: string;
    joinedAt: Date;
    lastLoginAt?: Date;
}

export interface ReferralsListResponse {
    totalReferrals: number;
    referrals: ReferralResponse[];
}