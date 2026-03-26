import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { IsString, IsEmail, IsOptional, IsNumberString } from "class-validator";

@Schema({ timestamps: true })
export class Typeform {
  @Prop()
  @IsString()
  fullName: string;

  @Prop()
  @IsEmail()
  email: string;

  @Prop()
  @IsNumberString()
  amountPaid: string;

  @Prop()
  tokens: number;

  @Prop()
  @IsOptional()
  @IsString()
  proofFileUrl?: string;

  @Prop()
  @IsString()
  transferMethod: string;

  @Prop()
  @IsOptional()
  @IsString()
  cryptoMethod?: string;

  @Prop()
  @IsOptional()
  @IsString()
  txHash?: string;

  @Prop()
  @IsOptional()
  @IsString()
  formId?: string;

  @Prop()
  @IsOptional()
  @IsString()
  submittedAt?: string;

  @Prop({ default: "pending" })
  status: string;
}

export type TypeformDocument = Typeform & Document;

export const TypeformSchema = SchemaFactory.createForClass(Typeform);
