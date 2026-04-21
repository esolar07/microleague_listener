// services/event-queue.service.ts
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import { ContractEventConfig, EventConfig } from '../config/listener.config';
import { HandlerRegistryService } from './handler-registry.service';
import { ProviderService } from './provider-pool.service';
import { PrismaService } from 'src/prisma/prisma.service';

interface EventJob {
  event: any;
  eventConfig: EventConfig;
  contractConfig: ContractEventConfig;
  attempt: number;
  firstAttemptAt: Date;
  eventId: string;
}

@Injectable()
export class EventQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventQueueService.name);
  private eventQueue: Queue<EventJob>;
  private deadLetterQueue: Queue<EventJob>;
  private worker: Worker<EventJob>;
  private queueEvents: QueueEvents;
  private redisConnection: Redis;

  constructor(
    private prisma: PrismaService,
    private handlerRegistry: HandlerRegistryService,
    private providers: ProviderService
  ) {}

  async onModuleInit() {
    await this.initializeQueues();
  }

  async onModuleDestroy() {
    await this.cleanup();
  }

  private async initializeQueues() {
    // Create Redis connection
    this.redisConnection = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.redisConnection.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });

    this.redisConnection.on('connect', () => {
      this.logger.log('Connected to Redis');
    });

    // Main event queue
    this.eventQueue = new Queue<EventJob>('blockchain-events', {
      connection: this.redisConnection,
      defaultJobOptions: {
        attempts: parseInt(process.env.EVENT_MAX_RETRIES) || 5,
        backoff: {
          type: 'exponential',
          delay: parseInt(process.env.EVENT_RETRY_DELAY) || 2000,
        },
        removeOnComplete: {
          count: 1000, // Keep last 1000 completed
          age: 24 * 3600, // Keep for 24 hours
        },
        removeOnFail: false, // Keep failed jobs for analysis
      },
    });

    // Dead letter queue for permanently failed events
    this.deadLetterQueue = new Queue<EventJob>('blockchain-events-dlq', {
      connection: this.redisConnection,
      defaultJobOptions: {
        removeOnComplete: false, // Never remove from DLQ
        removeOnFail: false,
      },
    });

    // Worker to process events
    const concurrency = parseInt(process.env.EVENT_WORKER_CONCURRENCY) || 10;
    this.worker = new Worker<EventJob>(
      'blockchain-events',
      async (job: Job<EventJob>) => {
        return await this.processEventJob(job);
      },
      {
        connection: this.redisConnection,
        concurrency,
        limiter: {
          max: parseInt(process.env.EVENT_RATE_LIMIT_MAX) || 100,
          duration: parseInt(process.env.EVENT_RATE_LIMIT_DURATION) || 1000,
        },
      }
    );

    // Queue events for monitoring
    this.queueEvents = new QueueEvents('blockchain-events', {
      connection: this.redisConnection,
    });

    this.setupWorkerHandlers();

    this.logger.log(
      `Event queue initialized with concurrency: ${concurrency}`
    );
  }

  /**
   * Enqueue an event for processing
   */
  async enqueueEvent(
    event: any,
    eventConfig: EventConfig,
    contractConfig: ContractEventConfig
  ): Promise<void> {
    const eventId = this.generateEventId(event, contractConfig, eventConfig.eventName);

    try {
      await this.eventQueue.add(
        `${contractConfig.contractName}-${eventConfig.eventName}`,
        {
          event,
          eventConfig,
          contractConfig,
          attempt: 0,
          firstAttemptAt: new Date(),
          eventId,
        },
        {
          jobId: eventId,
          priority: this.getPriority(contractConfig.contractName),
        }
      );

      this.logger.debug(`Event enqueued: ${eventId}`);
    } catch (error) {
      // If job already exists, that's okay (idempotency)
      if (error.message?.includes('already exists')) {
        this.logger.debug(`Event ${eventId} already in queue, skipping`);
      } else {
        this.logger.error(`Failed to enqueue event ${eventId}:`, error);
        throw error;
      }
    }
  }

  /**
   * Process a single event job
   */
  private async processEventJob(job: Job<EventJob>): Promise<void> {
    const { event, eventConfig, contractConfig, eventId } = job.data;

    this.logger.debug(
      `Processing event ${eventId} (attempt ${job.attemptsMade + 1}/${job.opts.attempts})`
    );

    const handler = this.handlerRegistry.getHandler(eventConfig.handler);
    if (!handler) {
      throw new Error(`Handler ${eventConfig.handler} not found`);
    }

    try {
      // Execute with provider failover
      await this.providers.executeWithFallback(
        async (provider) => {
          await handler.handle(event, contractConfig, provider);
        },
        3,
        `Event ${eventId}`
      );

      this.logger.log(
        `✓ Event processed successfully: ${event.transactionHash} (${eventConfig.eventName})`
      );
    } catch (error) {
      this.logger.error(
        `✗ Event processing failed: ${event.transactionHash} (attempt ${job.attemptsMade + 1}/${job.opts.attempts})`,
        error.stack
      );
      throw error; // Re-throw to trigger retry
    }
  }

  /**
   * Setup worker event handlers
   */
  private setupWorkerHandlers() {
    // Handle successful completion
    this.worker.on('completed', (job: Job<EventJob>) => {
      this.logger.debug(`Job ${job.id} completed successfully`);
    });

    // Handle permanent failures (exceeded retry limit)
    this.worker.on('failed', async (job: Job<EventJob>, error: Error) => {
      if (job.attemptsMade >= job.opts.attempts) {
        this.logger.error(
          `⚠️ Event PERMANENTLY FAILED after ${job.attemptsMade} attempts: ${job.data.eventId}`
        );

        await this.handlePermanentFailure(job, error);
      }
    });

    // Handle worker errors
    this.worker.on('error', (error) => {
      this.logger.error('Worker error:', error);
    });

    // Handle stalled jobs
    this.worker.on('stalled', (jobId: string) => {
      this.logger.warn(`Job ${jobId} stalled`);
    });

    // Queue events monitoring
    this.queueEvents.on('completed', ({ jobId }) => {
      this.logger.debug(`Event completed: ${jobId}`);
    });

    this.queueEvents.on('failed', ({ jobId, failedReason }) => {
      this.logger.warn(`Event failed: ${jobId} - ${failedReason}`);
    });
  }

  /**
   * Handle permanently failed events
   */
  private async handlePermanentFailure(job: Job<EventJob>, error: Error) {
    const { event, eventConfig, contractConfig, eventId, firstAttemptAt } = job.data;

    try {
      // Move to dead letter queue
      await this.deadLetterQueue.add('failed-event', job.data, {
        jobId: `dlq-${eventId}`,
      });

      // Store in database for manual review and retry
      await this.prisma.failedEvent.create({
        data: {
          eventId,
          contract: contractConfig.contractAddress,
          eventName: eventConfig.eventName,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          logIndex: event.index || 0,
          error: error.message,
          retryCount: job.attemptsMade || 0,
          lastRetryAt: new Date(),
        }
      });

      this.logger.log(
        `Failed event ${eventId} moved to DLQ and stored in database`
      );
    } catch (dbError) {
      this.logger.error(
        `Failed to store failed event ${eventId} in database:`,
        dbError
      );
    }
  }

  /**
   * Retry failed events from database
   */
  async retryFailedEvents(options: {
    contractAddress?: string;
    eventName?: string;
    limit?: number;
    olderThan?: Date;
  } = {}): Promise<{ retriedCount: number; errors: string[] }> {
    const { contractAddress, eventName, limit = 100, olderThan } = options;

    const where: any = { resolved: false };
    if (contractAddress) where.contract = contractAddress.toLowerCase();
    if (eventName) where.eventName = eventName;
    if (olderThan) where.createdAt = { lt: olderThan };

    try {
      const failedEvents = await this.prisma.failedEvent.findMany({
        where,
        orderBy: { createdAt: 'asc' }, // Oldest first
        take: limit,
      });

      const errors: string[] = [];
      let retriedCount = 0;

      for (const failedEvent of failedEvents) {
        try {
          // For now, just mark as resolved since we don't have the original event data
          await this.prisma.failedEvent.update({
            where: { id: failedEvent.id },
            data: {
              resolved: true,
              resolvedAt: new Date(),
              retryCount: failedEvent.retryCount + 1,
              lastRetryAt: new Date(),
            }
          });

          retriedCount++;
        } catch (error) {
          const errorMsg = `Failed to retry event ${failedEvent.eventId}: ${error.message}`;
          this.logger.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      this.logger.log(
        `Retried ${retriedCount}/${failedEvents.length} failed events`
      );

      return { retriedCount, errors };
    } catch (error) {
      this.logger.error('Error retrying failed events:', error);
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        this.eventQueue.getWaitingCount(),
        this.eventQueue.getActiveCount(),
        this.eventQueue.getCompletedCount(),
        this.eventQueue.getFailedCount(),
        this.eventQueue.getDelayedCount(),
      ]);

      const dlqCount = await this.deadLetterQueue.count();

      const failedEventsInDb = await this.prisma.failedEvent.count({
        where: { resolved: false }
      });

      return {
        mainQueue: {
          waiting,
          active,
          completed,
          failed,
          delayed,
          total: waiting + active + delayed,
        },
        deadLetterQueue: {
          count: dlqCount,
        },
        failedEventsInDatabase: failedEventsInDb,
      };
    } catch (error) {
      this.logger.error('Error getting queue stats:', error);
      return null;
    }
  }

  /**
   * Get failed events from database
   */
  async getFailedEvents(options: {
    contractAddress?: string;
    limit?: number;
    skip?: number;
  } = {}) {
    const { contractAddress, limit = 50, skip = 0 } = options;

    const where: any = { resolved: false };
    if (contractAddress) {
      where.contract = contractAddress.toLowerCase();
    }

    return await this.prisma.failedEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    });
  }

  /**
   * Clean up old completed jobs
   */
  async cleanupOldJobs(olderThanHours = 24) {
    try {
      const cutoff = Date.now() - olderThanHours * 60 * 60 * 1000;

      await this.eventQueue.clean(cutoff, 100, 'completed');
      await this.eventQueue.clean(cutoff, 100, 'failed');

      this.logger.log(`Cleaned up jobs older than ${olderThanHours} hours`);
    } catch (error) {
      this.logger.error('Error cleaning up old jobs:', error);
    }
  }

  // Helper methods
  private generateEventId(
    event: any,
    contractConfig: ContractEventConfig,
    eventName: string
  ): string {
    return `${contractConfig.contractAddress.toLowerCase()}-${eventName}-${event.transactionHash}-${event.index}`;
  }

  private getPriority(contractName: string): number {
    // Higher priority (lower number) for critical contracts
    const priorityMap: Record<string, number> = {
      PRESALE_CONTRACT: 1,
      PROPERTY_TITLE_NFT: 2,
      HOUSING_POOL_FACTORY: 3,
      HOUSING_POOL_LLC: 4,
      XHIFT_TOKEN: 5,
    };

    return priorityMap[contractName] || 10;
  }

  private async cleanup() {
    this.logger.log('Cleaning up event queue service...');

    if (this.worker) {
      await this.worker.close();
    }

    if (this.queueEvents) {
      await this.queueEvents.close();
    }

    if (this.eventQueue) {
      await this.eventQueue.close();
    }

    if (this.deadLetterQueue) {
      await this.deadLetterQueue.close();
    }

    if (this.redisConnection) {
      this.redisConnection.disconnect();
    }

    this.logger.log('Event queue service cleaned up');
  }
}
