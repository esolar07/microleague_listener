import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { DB_COLLECTIONS } from 'src/constants/collections';
import { ApiProperty } from '@nestjs/swagger';

export enum BuyerStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  ALL = 'All',
}

export type UserDocument = User & Document;

// Create User Schema
@Schema()
export class User extends Document {
  @ApiProperty({
    description: 'Wallet address',
    example: '0x742d35f8a9b3c4e1d2f6a8e7c9b5d4a3f2e1d0c9',
  })
  @Prop({
    lowercase: true,
    unique: true,
    // required: true,
  })
  walletAddress: string;

  @ApiProperty({ description: 'Total tokens purchased', example: 250000 })
  @Prop({ default: 0 })
  tokensPurchased: number;

  @ApiProperty({ description: 'Total amount spent in USD', example: 12500 })
  @Prop({ default: 0 })
  amountSpent: number;

  @ApiProperty({ description: 'Tokens claimed', example: 75000 })
  @Prop({ default: 0 })
  claimed: number;

  @ApiProperty({ description: 'Tokens unclaimed', example: 175000 })
  @Prop({ default: 0 })
  unclaimed: number;

  @ApiProperty({
    description: 'Join date',
    example: '2025-11-10T00:00:00.000Z',
  })
  @Prop()
  joinDate: Date;

  @ApiProperty({
    description: 'Last activity timestamp',
    example: '2025-11-22T14:30:00.000Z',
  })
  @Prop()
  lastActivity?: Date;

  @ApiProperty({
    description: 'Buyer status',
    enum: BuyerStatus,
    example: BuyerStatus.ACTIVE,
  })
  @Prop({
    type: String,
    enum: BuyerStatus,
    default: BuyerStatus.ACTIVE,
  })
  status: BuyerStatus;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String, lowercase: true })
  email: string;

  @Prop({ type: String })
  firstName: string;

  @Prop({ type: String })
  lastName: string;

  @Prop({ type: String })
  phone: string;

  @Prop({ type: String })
  profileImage: string;

  @Prop({ type: String })
  country: string;

  @Prop({ type: Types.ObjectId, ref: DB_COLLECTIONS.USERS, default: null })
  referredBy?: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: DB_COLLECTIONS.USERS, default: [] })
  referrals: Types.ObjectId[];

  @Prop({ type: Number, default: 0 })
  referralEarnings: number;

  @Prop({ type: Boolean, default: true })
  notificationsEnabled: boolean;

  @Prop({
    type: String,
    trim: true,
    lowercase: true,
    required: false,
    // unique: true,
  })
  username: string;

  @Prop({ type: String, trim: true, required: false })
  fullName: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: DB_COLLECTIONS.TOKEN }] })
  favourites: Types.ObjectId[];

  // KYC Verification Fields
  @ApiProperty({
    description: 'KYC verification status',
    enum: ['pending', 'submitted', 'approved', 'declined', 'abandoned'],
    example: 'pending',
  })
  @Prop({
    type: String,
    enum: ['pending', 'submitted', 'approved', 'declined', 'abandoned'],
    default: 'pending',
  })
  kycStatus: string;

  @ApiProperty({
    description: 'Veriff session ID for current/last verification',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  @Prop({ type: String, default: null })
  veriffSessionId: string;

  @ApiProperty({
    description: 'Timestamp when KYC was verified (approved)',
    example: '2025-01-15T10:30:00.000Z',
    required: false,
  })
  @Prop({ type: Date, default: null })
  kycVerifiedAt: Date;

  @ApiProperty({
    description: 'Reason for KYC decline (if applicable)',
    example: 'Document expired',
    required: false,
  })
  @Prop({ type: String, default: null })
  kycDeclinedReason: string;

  @Prop({ type: Number, default: 100, min: 0, max: 200 })
  reputationScore: number;

  @Prop({
    type: String,
    default: 'Good',
    enum: ['Excellent', 'Good', 'Fair', 'Poor', 'Very Poor'],
  })
  reputationTier: string;

  @Prop({ type: Date, default: null })
  reputationUpdatedAt: Date;

  // New reputation component scores
  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  poolContributionScore: number;

  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  kycScore: number;

  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  stakingScore: number;

  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  externalCreditScore: number;

  // Staking-related fields
  @Prop({ type: Number, default: 0 })
  stakedAmount: number;

  @Prop({ type: Date, default: null })
  stakingStartDate: Date;

  // External credit score integration
  @Prop({ type: Number, default: null, min: 300, max: 850 })
  externalCreditScoreValue: number;

  @Prop({ type: Date, default: null })
  externalCreditScoreUpdatedAt: Date;
}

// Create a SchemaFactory for User
export const UserSchema = SchemaFactory.createForClass(User);
