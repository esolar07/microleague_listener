import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";

export type BankTransferDocument = BankTransfer & Document;

export enum BankTransferStatus {
  PENDING = "Pending",
  VERIFIED = "Verified",
  REJECTED = "Rejected",
  ALL = "All",
}

@Schema({ timestamps: true })
export class BankTransfer {
  @Prop({ required: true })
  id: string; // BT-2025-001 format

  @Prop({ required: true })
  walletAddress: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  senderName: string;

  @Prop({ required: true })
  bankName: string;

  @Prop({ required: true })
  transactionRef: string;

  @Prop({ required: true })
  paymentRef: string;

  @Prop({ required: true })
  submittedDate: Date;

  @Prop({
    type: String,
    enum: BankTransferStatus,
    default: BankTransferStatus.PENDING,
  })
  status: BankTransferStatus;

  @Prop({ required: true })
  proofUrl: string;

  @Prop({ default: "" })
  notes: string;

  @Prop()
  verificationNote?: string;

  @Prop()
  verifiedBy?: string;

  @Prop()
  verifiedAt?: Date;

  @Prop()
  rejectedBy?: string;

  @Prop()
  rejectedAt?: Date;
}

export const BankTransferSchema = SchemaFactory.createForClass(BankTransfer);
