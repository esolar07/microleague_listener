// entities/failed-event.entity.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FailedEventDocument = HydratedDocument<FailedEvent>;

@Schema({ timestamps: true })
export class FailedEvent {
  @Prop({ required: true, index: true })
  eventId: string;

  @Prop({ required: true, index: true })
  contractAddress: string;

  @Prop({ required: true })
  contractName: string;

  @Prop({ required: true })
  eventName: string;

  @Prop({ required: true })
  transactionHash: string;

  @Prop({ required: true })
  blockNumber: number;

  @Prop({ type: Object })
  event: any;

  @Prop({ type: Object })
  eventConfig: any;

  @Prop({ type: Object })
  contractConfig: any;

  @Prop({ required: true })
  error: string;

  @Prop()
  stack: string;

  @Prop({ required: true })
  attempts: number;

  @Prop({ required: true })
  firstAttemptAt: Date;

  @Prop({ required: true })
  failedAt: Date;

  @Prop({ default: false, index: true })
  retried: boolean;

  @Prop()
  retriedAt: Date;

  @Prop()
  resolvedAt: Date;

  @Prop()
  notes: string;
}

export const FailedEventSchema = SchemaFactory.createForClass(FailedEvent);

// Indexes for efficient queries
FailedEventSchema.index({ contractAddress: 1, retried: 1 });
FailedEventSchema.index({ failedAt: -1 });
FailedEventSchema.index({ eventId: 1 }, { unique: true });
