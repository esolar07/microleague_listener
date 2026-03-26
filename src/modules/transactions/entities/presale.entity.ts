import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { DB_COLLECTIONS } from "src/constants/collections";

export enum PresaleTxType {
  BLOCKCHAIN = "Blockchain",
  WERT = "Wert",
  Crypto_Payment = "Crypto Payment",
  Bank_Transfer = "Bank Transfer",
  Other_Cryptos = "Other Cryptos",
  Card_Payment = "Card Payment",
  BUY = "Buy",
  CLAIM = "Claim",
  
}
@Schema({ timestamps: true })
export class PresaleTxs {
  @Prop()
  txHash: string;

  @Prop({ lowercase: true })
  contract: string;

  @Prop({ lowercase: true })
  address: string;

  @Prop()
  email?: string;

  @Prop({})
  tokenAddress: string;

  @Prop({ enum: PresaleTxType, default: PresaleTxType.Crypto_Payment })
  type: PresaleTxType;

  @Prop()
  amount: number;

  @Prop()
  stage: number;

  @Prop()
  tokens: number;

  @Prop()
  timestamp: number;

  @Prop()
  usdAmount: number;

  @Prop()
  quote: string;

  @Prop({ type: Types.ObjectId, ref: DB_COLLECTIONS.TYPEFORM, default: null })
  typeformId?: Types.ObjectId;
}

export type PresaleTxsDocument = PresaleTxs & Document;
export const PresaleTxsSchema = SchemaFactory.createForClass(PresaleTxs);
