import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger, Inject, forwardRef, Optional } from '@nestjs/common';
import { queueNames } from 'src/constants/queue.constants';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DB_COLLECTIONS } from 'src/constants/collections';
import { NotificationData } from './notification.service';
import { NotificationDocument } from './entities/notification.entity';
import { NotificationGateway } from './notification.gateway';

@Processor(queueNames.notification)
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    @InjectModel(DB_COLLECTIONS.NOTIFICATION)
    private notificationModel: Model<NotificationDocument>,
    @Optional()
    @Inject(forwardRef(() => NotificationGateway))
    private notificationGateway?: NotificationGateway,
  ) {}

  @Process('send-notification')
  async handleSendNotification(job: Job<NotificationData>) {
    const { userId, email, title, message, type, metadata } = job.data;

    try {
      this.logger.log(`Processing notification job ${job.id}: ${title}`);

      // Create notification document
      const notificationData: any = {
        title,
        message,
        type: type || 'info',
        metadata: metadata || {},
        read: false,
      };

      if (userId) {
        notificationData.userId = userId;
      }

      if (email) {
        notificationData.email = email.toLowerCase();
      }

      // Save notification to database
      const savedNotification = await this.notificationModel.create(notificationData);

      // Send WebSocket notification
      if (this.notificationGateway) {
        if (userId) {
          this.notificationGateway.sendToUser(userId, {
            id: savedNotification._id.toString(),
            title: savedNotification.title,
            message: savedNotification.message,
            type: savedNotification.type,
            read: savedNotification.read,
            metadata: savedNotification.metadata,
            createdAt: savedNotification.createdAt,
          });
        }

        if (email) {
          this.notificationGateway.sendToEmail(email.toLowerCase(), {
            id: savedNotification._id.toString(),
            title: savedNotification.title,
            message: savedNotification.message,
            type: savedNotification.type,
            read: savedNotification.read,
            metadata: savedNotification.metadata,
            createdAt: savedNotification.createdAt,
          });
        }
      } else {
        this.logger.warn('NotificationGateway not available, skipping WebSocket notification');
      }

      this.logger.log(`Notification processed and sent successfully: ${title} (Job ${job.id})`);

      return {
        success: true,
        notificationId: savedNotification._id.toString(),
        jobId: job.id,
      };
    } catch (error) {
      this.logger.error(
        `Failed to process notification (Job ${job.id}): ${error.message}`,
        error.stack,
      );
      throw error; // Re-throw to mark job as failed
    }
  }
}
