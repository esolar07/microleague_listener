import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";
import { DB_COLLECTIONS } from "src/constants/collections";
import { PurchaseStatus } from "../purchase.enums";

export type PurchaseWCDocument = PurchaseWC & Document;

// Define the rates array outside of the class
export const rates = [
  {
    price: 0.008,
    month: "April",
  },
  {
    price: 0.01,
    month: "May",
  },
  {
    price: 0.011,
    month: "June",
  },
];

@Schema({ timestamps: true })
export class PurchaseWC {
  @Prop({ lowercase: true })
  primaryWalletAddress: string;

  @Prop({ required: true })
  amount: number;

  @Prop()
  chainId: number;

  @Prop()
  claimRequest: boolean;

  @Prop()
  claimed: boolean;

  @Prop()
  name: string;

  @Prop()
  pref_crypto: string;

  @Prop({ unique: true })
  token: string;

  @Prop({ lowercase: true })
  email: string;

  @Prop({ enum: PurchaseStatus })
  requestStatus: string;

  @Prop({ enum: PurchaseStatus })
  status: string;

  @Prop()
  walletAddressCustom: string;

  @Prop()
  purchasedAt: string;

  @Prop()
  rfcAmount: number;

  @Prop()
  proof: string;

  // @Prop({ default: 1 })
  // vesting_period: number;
}

export const PurchaseWCSchema = SchemaFactory.createForClass(PurchaseWC);
PurchaseWCSchema.set("toJSON", { virtuals: true });
PurchaseWCSchema.set("toObject", { virtuals: true });

export const PurchaseModel = mongoose.model<PurchaseWCDocument>(
  DB_COLLECTIONS.PURCHASE_WITH_CARD,
  PurchaseWCSchema
);
