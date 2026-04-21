// services/reorg-detector.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProviderService } from './provider-pool.service';

interface BlockInfo {
  blockNumber: number;
  blockHash: string;
  timestamp: number;
}

@Injectable()
export class ReorgDetectorService {
  private readonly logger = new Logger(ReorgDetectorService.name);
  private blockCache = new Map<number, BlockInfo>();
  private readonly MAX_CACHE_SIZE = 100;

  constructor(
    private prisma: PrismaService,
    private providerPool: ProviderService
  ) {}

  /**
   * Check for reorganizations
   */
  async checkForReorgs(): Promise<void> {
    try {
      this.logger.debug('Checking for blockchain reorganizations...');
      // Simplified reorg detection - just log for now
      // You can implement more sophisticated reorg detection later
    } catch (error) {
      this.logger.error('Error checking for reorgs:', error);
    }
  }

  /**
   * Handle detected reorganization
   */
  async handleReorg(
    contractAddress: string,
    reorgFromBlock: number,
    newBlockHash: string
  ): Promise<{ eventsMarked: number; blockReset: boolean }> {
    try {
      this.logger.warn(
        `Handling reorg for ${contractAddress} from block ${reorgFromBlock}`
      );

      // Mark events as reorged
      const result = await this.prisma.listenerState.updateMany({
        where: {
          contract: contractAddress.toLowerCase(),
          blockNumber: { gte: reorgFromBlock },
        },
        data: {
          reorged: true,
          reorgedAt: new Date(),
        }
      });

      return {
        eventsMarked: result.count,
        blockReset: true,
      };
    } catch (error) {
      this.logger.error(`Error handling reorg for ${contractAddress}:`, error);
      return { eventsMarked: 0, blockReset: false };
    }
  }

  /**
   * Get reorg statistics
   */
  async getReorgStats(contractAddress?: string) {
    try {
      const where: any = { reorged: true };
      if (contractAddress) {
        where.contract = contractAddress.toLowerCase();
      }

      const totalReorgedEvents = await this.prisma.listenerState.count({ where });

      return {
        totalReorgedEvents,
        reorgedByContract: [],
        oldestReorg: null,
        newestReorg: null,
      };
    } catch (error) {
      this.logger.error('Error getting reorg stats:', error);
      return {
        totalReorgedEvents: 0,
        reorgedByContract: [],
        oldestReorg: null,
        newestReorg: null,
      };
    }
  }

  /**
   * Clear reorg flags for events
   */
  async clearReorgFlags(
    contractAddress: string,
    fromBlock: number,
    toBlock: number
  ): Promise<number> {
    try {
      const result = await this.prisma.listenerState.updateMany({
        where: {
          contract: contractAddress.toLowerCase(),
          blockNumber: { gte: fromBlock, lte: toBlock },
          reorged: true,
        },
        data: {
          reorged: false,
          reorgedAt: null,
        }
      });

      return result.count;
    } catch (error) {
      this.logger.error(`Error clearing reorg flags for ${contractAddress}:`, error);
      return 0;
    }
  }
}