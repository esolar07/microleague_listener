// src/interfaces/user.interface.ts
import { Types } from 'mongoose';

export interface UserResponse {
    _id: Types.ObjectId;
    walletAddress: string;
    referralCode: string;
    referralLink?: string;
    lastLoginAt?: Date;
    nftActivities: NFTActivity[];
}
export interface NFTActivity {
    type: string;
    count: number;
    earnings: number;
    claimed: boolean;
    lastUpdated: Date;
}

export interface ReferralResponse {
    username: string;
    joinedAt: Date;
    nftPurchases: number;
    nftMint: number;
    nftList: number;
    earnings: number;
    claimStatus: boolean;
}


export interface ReferralsListResponse {
    totalReferrals: number;
    referrals: ReferralResponse[];
}

// export interface ReferralResponse {
//     walletAddress: string;
//     joinedAt: Date;
//     lastLoginAt?: Date;
// }

export interface DailySignupResponse {
    _id: string;
    count: number;
}