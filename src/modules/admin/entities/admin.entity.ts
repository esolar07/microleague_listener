import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type AdminDocument = Admin & Document;

@Schema({ timestamps: true })
export class Admin {
  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop({ lowercase: true, unique: true })
  address: string;

  @Prop({ default: false })
  superAdmin: boolean;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
