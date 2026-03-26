import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";
import { DB_COLLECTIONS } from "src/constants/collections";
import { PurchaseStatus } from "../purchase.enums";

export type PurchaseDocument = Purchase & Document;

@Schema({ timestamps: true })
export class Purchase {
  @Prop({ required: true, lowercase: true })
  primaryWalletAddress: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  ethAmount: number;

  @Prop({ required: true, unique: true })
  transactionHash: string;

  @Prop()
  chainId: number;

  @Prop()
  timestamp: number;

  @Prop()
  claimRequest: boolean;

  @Prop({ lowercase: true })
  email: string;

  @Prop({ enum: PurchaseStatus })
  status: string;

  @Prop({ lowercase: true })
  walletAddressCustom: string;

  @Prop()
  purchasedAt: Date;

  // @Prop({ default: 1 })
  // vesting_period: number;
}

export const PurchaseSchema = SchemaFactory.createForClass(Purchase);

export const PurchaseModel = mongoose.model<PurchaseDocument>(
  DB_COLLECTIONS.PURCHASE,
  PurchaseSchema
);
