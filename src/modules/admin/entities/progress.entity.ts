import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type ProgressDocument = Progress & Document;
@Schema({ timestamps: true })
export class Progress extends Document {
  @Prop({ required: true })
  value: number;
}

export const ProgressSchema = SchemaFactory.createForClass(Progress);
