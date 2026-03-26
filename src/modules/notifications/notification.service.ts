import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { queueNames } from 'src/constants/queue.constants';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DB_COLLECTIONS } from 'src/constants/collections';
import {
  Notification,
  NotificationDocument,
  NotificationType,
} from './entities/notification.entity';

export interface NotificationData {
  userId?: string;
  email?: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  metadata?: Record<string, any>;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectQueue(queueNames.notification)
    private notificationQueue: Queue,
    @InjectModel(DB_COLLECTIONS.NOTIFICATION)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  async sendNotification(data: NotificationData) {
    try {
      if (!data.userId && !data.email) {
        throw new BadRequestException('Either userId or email must be provided');
      }

      const job = await this.notificationQueue.add('send-notification', data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      });

      this.logger.log(`Notification queued: ${data.title} (Job ID: ${job.id})`);

      return {
        success: true,
        jobId: job.id,
        message: 'Notification queued successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to queue notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  async sendBulkNotifications(notifications: NotificationData[]) {
    const jobs = notifications.map((data) => ({
      name: 'send-notification',
      data,
      opts: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }));

    try {
      const addedJobs = await this.notificationQueue.addBulk(jobs);
      this.logger.log(`Bulk notifications queued: ${addedJobs.length} jobs`);

      return {
        success: true,
        jobIds: addedJobs.map((job) => job.id),
        count: addedJobs.length,
      };
    } catch (error) {
      this.logger.error(`Failed to queue bulk notifications: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getUserNotifications(
    userId?: string,
    email?: string,
    query: {
      page?: number;
      limit?: number;
      read?: boolean;
      type?: NotificationType;
    } = {},
  ) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (userId) {
      filter.userId = new Types.ObjectId(userId);
    } else if (email) {
      filter.email = email.toLowerCase();
    } else {
      throw new BadRequestException('Either userId or email must be provided');
    }

    if (query.read !== undefined) {
      filter.read = query.read;
    }

    if (query.type) {
      filter.type = query.type;
    }

    const [notifications, total] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.notificationModel.countDocuments(filter).exec(),
    ]);

    return {
      notifications: notifications.map((notif) => ({
        id: notif._id.toString(),
        userId: notif.userId?.toString(),
        email: notif.email,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        read: notif.read,
        readAt: notif.readAt,
        metadata: notif.metadata,
        createdAt: notif.createdAt,
        updatedAt: notif.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUnreadCount(userId?: string, email?: string): Promise<number> {
    const filter: any = { read: false };

    if (userId) {
      filter.userId = new Types.ObjectId(userId);
    } else if (email) {
      filter.email = email.toLowerCase();
    } else {
      return 0;
    }

    return this.notificationModel.countDocuments(filter).exec();
  }

  async markAsRead(
    userId: string | undefined,
    email: string | undefined,
    notificationIds: string[],
  ) {
    const filter: any = {
      _id: { $in: notificationIds.map((id) => new Types.ObjectId(id)) },
    };

    if (userId) {
      filter.userId = new Types.ObjectId(userId);
    } else if (email) {
      filter.email = email.toLowerCase();
    } else {
      throw new BadRequestException('Either userId or email must be provided');
    }

    const result = await this.notificationModel.updateMany(filter, {
      $set: {
        read: true,
        readAt: new Date(),
      },
    });

    return {
      success: true,
      modifiedCount: result.modifiedCount,
      message: `${result.modifiedCount} notification(s) marked as read`,
    };
  }

  async markAllAsRead(userId?: string, email?: string) {
    const filter: any = { read: false };

    if (userId) {
      filter.userId = new Types.ObjectId(userId);
    } else if (email) {
      filter.email = email.toLowerCase();
    } else {
      throw new BadRequestException('Either userId or email must be provided');
    }

    const result = await this.notificationModel.updateMany(filter, {
      $set: {
        read: true,
        readAt: new Date(),
      },
    });

    return {
      success: true,
      modifiedCount: result.modifiedCount,
      message: `${result.modifiedCount} notification(s) marked as read`,
    };
  }

  async getNotificationById(id: string, userId?: string, email?: string) {
    const filter: any = { _id: new Types.ObjectId(id) };

    if (userId) {
      filter.userId = new Types.ObjectId(userId);
    } else if (email) {
      filter.email = email.toLowerCase();
    }

    const notification = await this.notificationModel.findOne(filter).lean().exec();

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return {
      id: notification._id.toString(),
      userId: notification.userId?.toString(),
      email: notification.email,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      read: notification.read,
      readAt: notification.readAt,
      metadata: notification.metadata,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  }
}
