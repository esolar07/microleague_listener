import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({ timestamps: true })
export class ClaimRequest {
    @Prop({ required: true, lowercase: true })
    address: string;

    @Prop()
    contract: string;

    @Prop()
    tokenAddress: string;

    @Prop()
    chainId: string;

    @Prop()
    txHash: string;

    @Prop()
    amount: number;

    @Prop()
    timestamp: number;
}

export type ClaimRequestDocument = ClaimRequest & Document;
export const ClaimRequestSchema = SchemaFactory.createForClass(ClaimRequest);
