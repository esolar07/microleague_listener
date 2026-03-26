// services/reorg-detector.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProviderService } from './provider-pool.service';
import { StateDocument } from '../entity/listener.state.entity';
import { DB_COLLECTIONS } from 'src/constants/collections';

interface BlockInfo {
  blockNumber: number;
  blockHash: string;
  timestamp: Date;
}

@Injectable()
export class ReorgDetectorService {
  private readonly logger = new Logger(ReorgDetectorService.name);
  private blockCache = new Map<number, BlockInfo>();
  private readonly CONFIRMATION_BLOCKS =
    parseInt(process.env.CONFIRMATION_BLOCKS) || 12;
  private readonly MAX_CACHE_SIZE = 100;

  constructor(
    @InjectModel(DB_COLLECTIONS.STATE) private stateModel: Model<StateDocument>,
    private providerPool: ProviderService
  ) {}

  /**
   * Detect if a reorganization has occurred
   */
  async detectReorg(currentBlock: number): Promise<{
    reorgDetected: boolean;
    reorgFromBlock?: number;
    reorgToBlock?: number;
    affectedBlocks?: number;
  }> {
    try {
      // Check the last CONFIRMATION_BLOCKS blocks for reorgs
      const blocksToCheck = Math.min(currentBlock, this.CONFIRMATION_BLOCKS);

      for (let i = 1; i <= blocksToCheck; i++) {
        const blockNumber = currentBlock - i;
        const cachedBlockInfo = this.blockCache.get(blockNumber);

        if (cachedBlockInfo) {
          // Verify block hash hasn't changed
          const currentBlockHash = await this.getBlockHash(blockNumber);

          if (currentBlockHash !== cachedBlockInfo.blockHash) {
            this.logger.warn(
              `⚠️ REORG DETECTED! Block ${blockNumber} hash changed from ${cachedBlockInfo.blockHash} to ${currentBlockHash}`
            );

            // Find the extent of the reorg
            const reorgFromBlock = await this.findReorgStart(blockNumber);

            const affectedBlocks = currentBlock - reorgFromBlock + 1;

            return {
              reorgDetected: true,
              reorgFromBlock,
              reorgToBlock: currentBlock,
              affectedBlocks,
            };
          }
        }
      }

      // No reorg detected - update cache with current block
      await this.updateBlockCache(currentBlock);

      return { reorgDetected: false };
    } catch (error) {
      this.logger.error('Error detecting reorg:', error);
      return { reorgDetected: false };
    }
  }

  /**
   * Find where the reorganization started using binary search
   */
  private async findReorgStart(suspectedBlock: number): Promise<number> {
    // Binary search to find where reorg started
    let low = Math.max(0, suspectedBlock - 100);
    let high = suspectedBlock;

    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      const cachedInfo = this.blockCache.get(mid);

      if (cachedInfo) {
        const currentHash = await this.getBlockHash(mid);

        if (currentHash === cachedInfo.blockHash) {
          // This block is still valid, reorg started after
          low = mid + 1;
        } else {
          // This block changed, reorg started at or before
          high = mid;
        }
      } else {
        // No cached data, assume after this block
        low = mid + 1;
      }

      // Avoid infinite loop
      if (high - low <= 1) {
        break;
      }
    }

    return low;
  }

  /**
   * Handle a detected reorganization
   */
  async handleReorg(
    fromBlock: number,
    toBlock: number,
    contractAddress: string
  ): Promise<void> {
    this.logger.warn(
      `🔄 Handling reorg from block ${fromBlock} to ${toBlock} for contract ${contractAddress}`
    );

    try {
      // 1. Mark events in reorged blocks as invalid
      const updateResult = await this.stateModel.updateMany(
        {
          contract: contractAddress.toLowerCase(),
          blockNumber: { $gte: fromBlock, $lte: toBlock },
          type: { $ne: 'lastProcessedBlock' },
        },
        {
          $set: {
            reorged: true,
            reorgedAt: new Date(),
          },
        }
      );

      this.logger.log(
        `Marked ${updateResult.modifiedCount} events as reorged`
      );

      // 2. Reset last processed block to before reorg
      await this.stateModel.findOneAndUpdate(
        {
          contract: contractAddress.toLowerCase(),
          type: 'lastProcessedBlock',
        },
        {
          $set: {
            blockNumber: fromBlock - 1,
            updatedAt: new Date(),
          },
        }
      );

      // 3. Clear block cache for affected range
      for (let block = fromBlock; block <= toBlock; block++) {
        this.blockCache.delete(block);
      }

      this.logger.log(
        `Reorg handled successfully. Will reprocess from block ${fromBlock}`
      );
    } catch (error) {
      this.logger.error(`Error handling reorg:`, error);
      throw error;
    }
  }

  /**
   * Handle reorg for all contracts
   */
  async handleReorgForAllContracts(
    fromBlock: number,
    toBlock: number
  ): Promise<void> {
    this.logger.warn(
      `🔄 Handling reorg from block ${fromBlock} to ${toBlock} for ALL contracts`
    );

    try {
      // Get all unique contract addresses
      const contracts = await this.stateModel.distinct('contract', {
        type: 'lastProcessedBlock',
      });

      this.logger.log(`Found ${contracts.length} contracts to handle reorg for`);

      // Handle reorg for each contract
      for (const contractAddress of contracts) {
        await this.handleReorg(fromBlock, toBlock, contractAddress);
      }

      this.logger.log('Reorg handled for all contracts');
    } catch (error) {
      this.logger.error('Error handling reorg for all contracts:', error);
      throw error;
    }
  }

  /**
   * Update block cache with current block information
   */
  private async updateBlockCache(blockNumber: number): Promise<void> {
    try {
      const blockHash = await this.getBlockHash(blockNumber);

      this.blockCache.set(blockNumber, {
        blockNumber,
        blockHash,
        timestamp: new Date(),
      });

      // Maintain cache size limit
      if (this.blockCache.size > this.MAX_CACHE_SIZE) {
        // Remove oldest entries
        const sortedBlocks = Array.from(this.blockCache.keys()).sort(
          (a, b) => a - b
        );
        const toRemove = sortedBlocks.slice(
          0,
          this.blockCache.size - this.MAX_CACHE_SIZE
        );

        toRemove.forEach((block) => this.blockCache.delete(block));
      }
    } catch (error) {
      this.logger.error(
        `Error updating block cache for block ${blockNumber}:`,
        error
      );
    }
  }

  /**
   * Get block hash with caching
   */
  private async getBlockHash(blockNumber: number): Promise<string> {
    return await this.providerPool.executeWithFallback(
      async (provider) => {
        const block = await provider.getBlock(blockNumber);
        if (!block) {
          throw new Error(`Block ${blockNumber} not found`);
        }
        return block.hash;
      },
      3,
      `Get block hash ${blockNumber}`
    );
  }

  /**
   * Check if a specific block has been reorged
   */
  async isBlockReorged(
    blockNumber: number,
    blockHash: string
  ): Promise<boolean> {
    try {
      const currentHash = await this.getBlockHash(blockNumber);
      return currentHash !== blockHash;
    } catch (error) {
      this.logger.error(
        `Error checking if block ${blockNumber} is reorged:`,
        error
      );
      return false;
    }
  }

  /**
   * Get reorg statistics
   */
  async getReorgStats(contractAddress?: string): Promise<{
    totalReorgedEvents: number;
    reorgedByContract?: Array<{ contract: string; count: number }>;
    oldestReorg?: Date;
    newestReorg?: Date;
  }> {
    try {
      const query: any = { reorged: true };
      if (contractAddress) {
        query.contract = contractAddress.toLowerCase();
      }

      const totalReorgedEvents = await this.stateModel.countDocuments(query);

      let reorgedByContract = [];
      if (!contractAddress) {
        reorgedByContract = await this.stateModel.aggregate([
          { $match: { reorged: true } },
          {
            $group: {
              _id: '$contract',
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              contract: '$_id',
              count: 1,
            },
          },
          { $sort: { count: -1 } },
        ]);
      }

      const reorgDates = await this.stateModel
        .find(query, { reorgedAt: 1 })
        .sort({ reorgedAt: 1 })
        .limit(1)
        .exec();

      const newestReorg = await this.stateModel
        .find(query, { reorgedAt: 1 })
        .sort({ reorgedAt: -1 })
        .limit(1)
        .exec();

      return {
        totalReorgedEvents,
        reorgedByContract: contractAddress ? undefined : reorgedByContract,
        oldestReorg: reorgDates[0]?.reorgedAt,
        newestReorg: newestReorg[0]?.reorgedAt,
      };
    } catch (error) {
      this.logger.error('Error getting reorg stats:', error);
      return { totalReorgedEvents: 0 };
    }
  }

  /**
   * Clear reorg flags (after manual verification)
   */
  async clearReorgFlags(
    contractAddress: string,
    fromBlock: number,
    toBlock: number
  ): Promise<number> {
    try {
      const result = await this.stateModel.updateMany(
        {
          contract: contractAddress.toLowerCase(),
          blockNumber: { $gte: fromBlock, $lte: toBlock },
          reorged: true,
        },
        {
          $set: {
            reorged: false,
          },
          $unset: {
            reorgedAt: '',
          },
        }
      );

      this.logger.log(
        `Cleared reorg flags for ${result.modifiedCount} events`
      );

      return result.modifiedCount;
    } catch (error) {
      this.logger.error('Error clearing reorg flags:', error);
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const blocks = Array.from(this.blockCache.keys()).sort((a, b) => a - b);

    return {
      cachedBlocks: this.blockCache.size,
      oldestCachedBlock: blocks[0],
      newestCachedBlock: blocks[blocks.length - 1],
      maxCacheSize: this.MAX_CACHE_SIZE,
      confirmationBlocks: this.CONFIRMATION_BLOCKS,
    };
  }

  /**
   * Clear cache (for testing/debugging)
   */
  clearCache(): void {
    this.blockCache.clear();
    this.logger.log('Block cache cleared');
  }
}
