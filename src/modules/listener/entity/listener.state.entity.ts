import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type StateDocument = HydratedDocument<State>;

@Schema({ timestamps: true })
export class State {
  @Prop()
  contract: string;

  @Prop()
  blockNumber: number;

  @Prop()
  hash: string;

  @Prop()
  logIndex: number;

  @Prop()
  processedAt: Date;

  @Prop()
  eventId: string;

  @Prop()
  type: string;

  @Prop()
  eventName: string;

  @Prop()
  blockHash: string;

  @Prop({ default: false })
  reorged: boolean;

  @Prop()
  reorgedAt: Date;
}

export const StateSchema = SchemaFactory.createForClass(State);
