import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { DB_COLLECTIONS } from 'src/constants/collections';
import { ApiProperty } from '@nestjs/swagger';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

@Schema({ timestamps: true })
export class Notification {
  @ApiProperty({
    description: 'User ID who will receive the notification',
    example: '507f1f77bcf86cd799439011',
  })
  @Prop({ type: Types.ObjectId, ref: DB_COLLECTIONS.USERS, required: false })
  userId?: Types.ObjectId;

  @ApiProperty({
    description: 'Email address for notifications',
    example: 'user@example.com',
  })
  @Prop({ type: String, lowercase: true, required: false })
  email?: string;

  @ApiProperty({
    description: 'Notification title',
    example: 'Payment Confirmed',
  })
  @Prop({ type: String, required: true })
  title: string;

  @ApiProperty({
    description: 'Notification message',
    example: 'Your payment has been successfully processed',
  })
  @Prop({ type: String, required: true })
  message: string;

  @ApiProperty({
    description: 'Notification type',
    enum: NotificationType,
    example: NotificationType.SUCCESS,
  })
  @Prop({
    type: String,
    enum: NotificationType,
    default: NotificationType.INFO,
  })
  type: NotificationType;

  @ApiProperty({
    description: 'Whether the notification has been read',
    example: false,
  })
  @Prop({ type: Boolean, default: false })
  read: boolean;

  @ApiProperty({
    description: 'When the notification was read',
    example: '2025-01-15T10:30:00.000Z',
    required: false,
  })
  @Prop({ type: Date, required: false })
  readAt?: Date;

  @ApiProperty({
    description: 'Additional metadata for the notification',
    example: { transactionId: '123', amount: 100 },
    required: false,
  })
  @Prop({ type: Object, required: false })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Create indexes for better query performance
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ email: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: -1 });
