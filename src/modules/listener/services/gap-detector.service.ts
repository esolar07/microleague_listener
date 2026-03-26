// services/gap-detector.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StateDocument } from '../entity/listener.state.entity';
import { DB_COLLECTIONS } from 'src/constants/collections';

export interface Gap {
  fromBlock: number;
  toBlock: number;
  size: number;
}

export interface GapDetectionResult {
  contractAddress: string;
  gaps: Gap[];
  totalGapBlocks: number;
  lastProcessedBlock: number;
  hasGaps: boolean;
}

@Injectable()
export class GapDetectorService {
  private readonly logger = new Logger(GapDetectorService.name);

  constructor(
    @InjectModel(DB_COLLECTIONS.STATE) private stateModel: Model<StateDocument>
  ) {}

  /**
   * Detect gaps in processed blocks for a specific contract
   */
  async detectGaps(
    contractAddress: string,
    startBlock?: number
  ): Promise<GapDetectionResult> {
    try {
      const contractAddressLower = contractAddress.toLowerCase();

      // Get last processed block
      const lastProcessedDoc = await this.stateModel.findOne({
        contract: contractAddressLower,
        type: 'lastProcessedBlock',
      });

      if (!lastProcessedDoc) {
        this.logger.warn(`No processed blocks found for contract ${contractAddress}`);
        return {
          contractAddress,
          gaps: [],
          totalGapBlocks: 0,
          lastProcessedBlock: 0,
          hasGaps: false,
        };
      }

      const lastProcessedBlock = lastProcessedDoc.blockNumber;
      const effectiveStartBlock = startBlock || 0;

      // Get all unique blocks that have been processed
      const processedBlocks = await this.stateModel.distinct('blockNumber', {
        contract: contractAddressLower,
        blockNumber: { $gte: effectiveStartBlock, $lte: lastProcessedBlock },
        type: { $ne: 'lastProcessedBlock' },
      });

      if (processedBlocks.length === 0) {
        this.logger.warn(`No events processed for contract ${contractAddress}`);
        return {
          contractAddress,
          gaps: [],
          totalGapBlocks: 0,
          lastProcessedBlock,
          hasGaps: false,
        };
      }

      // Sort blocks
      const sortedBlocks = processedBlocks.sort((a, b) => a - b);

      // Find gaps
      const gaps: Gap[] = [];
      let totalGapBlocks = 0;

      // Check for gap before first processed block
      if (sortedBlocks[0] > effectiveStartBlock) {
        const gap: Gap = {
          fromBlock: effectiveStartBlock,
          toBlock: sortedBlocks[0] - 1,
          size: sortedBlocks[0] - effectiveStartBlock,
        };
        gaps.push(gap);
        totalGapBlocks += gap.size;
      }

      // Check for gaps between processed blocks
      for (let i = 1; i < sortedBlocks.length; i++) {
        const currentBlock = sortedBlocks[i];
        const previousBlock = sortedBlocks[i - 1];

        if (currentBlock - previousBlock > 1) {
          const gap: Gap = {
            fromBlock: previousBlock + 1,
            toBlock: currentBlock - 1,
            size: currentBlock - previousBlock - 1,
          };
          gaps.push(gap);
          totalGapBlocks += gap.size;
        }
      }

      // Check for gap after last processed block
      if (sortedBlocks[sortedBlocks.length - 1] < lastProcessedBlock) {
        const gap: Gap = {
          fromBlock: sortedBlocks[sortedBlocks.length - 1] + 1,
          toBlock: lastProcessedBlock,
          size: lastProcessedBlock - sortedBlocks[sortedBlocks.length - 1],
        };
        gaps.push(gap);
        totalGapBlocks += gap.size;
      }

      this.logger.log(
        `Detected ${gaps.length} gaps totaling ${totalGapBlocks} blocks for contract ${contractAddress}`
      );

      return {
        contractAddress,
        gaps,
        totalGapBlocks,
        lastProcessedBlock,
        hasGaps: gaps.length > 0,
      };
    } catch (error) {
      this.logger.error(`Error detecting gaps for contract ${contractAddress}:`, error);
      throw error;
    }
  }

  /**
   * Detect gaps for all contracts
   */
  async detectGapsForAllContracts(startBlock?: number): Promise<GapDetectionResult[]> {
    try {
      // Get all unique contract addresses
      const contracts = await this.stateModel.distinct('contract', {
        type: 'lastProcessedBlock',
      });

      this.logger.log(`Checking gaps for ${contracts.length} contracts`);

      const results = await Promise.all(
        contracts.map((contractAddress) => this.detectGaps(contractAddress, startBlock))
      );

      const contractsWithGaps = results.filter((r) => r.hasGaps);

      this.logger.log(
        `${contractsWithGaps.length}/${contracts.length} contracts have gaps`
      );

      return results;
    } catch (error) {
      this.logger.error('Error detecting gaps for all contracts:', error);
      throw error;
    }
  }

  /**
   * Get gap summary statistics
   */
  async getGapSummary(contractAddress?: string): Promise<{
    totalContracts?: number;
    contractsWithGaps?: number;
    totalGapBlocks?: number;
    largestGap?: Gap & { contractAddress: string };
    contractSpecificGaps?: number;
  }> {
    try {
      if (contractAddress) {
        const result = await this.detectGaps(contractAddress);
        return {
          contractSpecificGaps: result.gaps.length,
          totalGapBlocks: result.totalGapBlocks,
          largestGap: result.gaps.length > 0
            ? { ...result.gaps.sort((a, b) => b.size - a.size)[0], contractAddress }
            : undefined,
        };
      }

      const results = await this.detectGapsForAllContracts();

      const contractsWithGaps = results.filter((r) => r.hasGaps);
      const totalGapBlocks = results.reduce((sum, r) => sum + r.totalGapBlocks, 0);

      let largestGap: (Gap & { contractAddress: string }) | undefined;
      let maxGapSize = 0;

      for (const result of results) {
        for (const gap of result.gaps) {
          if (gap.size > maxGapSize) {
            maxGapSize = gap.size;
            largestGap = { ...gap, contractAddress: result.contractAddress };
          }
        }
      }

      return {
        totalContracts: results.length,
        contractsWithGaps: contractsWithGaps.length,
        totalGapBlocks,
        largestGap,
      };
    } catch (error) {
      this.logger.error('Error getting gap summary:', error);
      throw error;
    }
  }

  /**
   * Check if a specific block range has been processed
   */
  async isBlockRangeProcessed(
    contractAddress: string,
    fromBlock: number,
    toBlock: number
  ): Promise<{
    fullyProcessed: boolean;
    processedBlocks: number[];
    missingBlocks: number[];
  }> {
    try {
      const processedBlocks = await this.stateModel.distinct('blockNumber', {
        contract: contractAddress.toLowerCase(),
        blockNumber: { $gte: fromBlock, $lte: toBlock },
        type: { $ne: 'lastProcessedBlock' },
      });

      const processedSet = new Set(processedBlocks);
      const missingBlocks: number[] = [];

      for (let block = fromBlock; block <= toBlock; block++) {
        if (!processedSet.has(block)) {
          missingBlocks.push(block);
        }
      }

      return {
        fullyProcessed: missingBlocks.length === 0,
        processedBlocks: processedBlocks.sort((a, b) => a - b),
        missingBlocks,
      };
    } catch (error) {
      this.logger.error('Error checking block range:', error);
      throw error;
    }
  }

  /**
   * Get blocks with sparse events (potential issues)
   */
  async detectSparseBlocks(
    contractAddress: string,
    minEventsPerBlock = 1
  ): Promise<{
    sparseBlocks: Array<{ blockNumber: number; eventCount: number }>;
    averageEventsPerBlock: number;
  }> {
    try {
      const eventCounts = await this.stateModel.aggregate([
        {
          $match: {
            contract: contractAddress.toLowerCase(),
            type: { $ne: 'lastProcessedBlock' },
          },
        },
        {
          $group: {
            _id: '$blockNumber',
            eventCount: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            blockNumber: '$_id',
            eventCount: 1,
          },
        },
        { $sort: { blockNumber: 1 } },
      ]);

      const sparseBlocks = eventCounts.filter(
        (block) => block.eventCount < minEventsPerBlock
      );

      const totalEvents = eventCounts.reduce((sum, block) => sum + block.eventCount, 0);
      const averageEventsPerBlock = eventCounts.length > 0 ? totalEvents / eventCounts.length : 0;

      return {
        sparseBlocks,
        averageEventsPerBlock,
      };
    } catch (error) {
      this.logger.error('Error detecting sparse blocks:', error);
      throw error;
    }
  }

  /**
   * Verify data integrity (check for duplicates)
   */
  async verifyDataIntegrity(contractAddress: string): Promise<{
    totalEvents: number;
    duplicateEventIds: string[];
    hasDuplicates: boolean;
  }> {
    try {
      const duplicates = await this.stateModel.aggregate([
        {
          $match: {
            contract: contractAddress.toLowerCase(),
            type: { $ne: 'lastProcessedBlock' },
          },
        },
        {
          $group: {
            _id: '$eventId',
            count: { $sum: 1 },
          },
        },
        {
          $match: {
            count: { $gt: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            eventId: '$_id',
            count: 1,
          },
        },
      ]);

      const totalEvents = await this.stateModel.countDocuments({
        contract: contractAddress.toLowerCase(),
        type: { $ne: 'lastProcessedBlock' },
      });

      return {
        totalEvents,
        duplicateEventIds: duplicates.map((d) => d.eventId),
        hasDuplicates: duplicates.length > 0,
      };
    } catch (error) {
      this.logger.error('Error verifying data integrity:', error);
      throw error;
    }
  }
}
