// src/interfaces/auth.interface.ts
import { Types } from 'mongoose';
import { NFTActivity } from './user.interface';

export interface AuthResponse {
    statusCode: number;
    message: string;
    data: {
        user: {
            _id: Types.ObjectId;
            walletAddress: string;
            referralCode: string;
            referralLink: string;
            referrals: Array<{
                _id: Types.ObjectId; 
                walletAddress: string; 
                referralDate: Date; 
                username:string
            }>;
            nftActivities: NFTActivity[];
        };
        accessToken: string;
    };
}

export interface WalletConnectDto {
    walletAddress: string;
    referralCode?: string;
}