// handlers/presale-claim.handler.ts
import { Injectable } from "@nestjs/common";
import { formatEther, JsonRpcProvider } from "ethers";

import { BaseEventHandler } from "./base-event.handler";
import { ContractEventConfig } from "../config/listener.config";
import { PrismaService } from "src/prisma/prisma.service";
import { PresaleTxType } from "@prisma/client";

@Injectable()
export class PresaleClaimHandler extends BaseEventHandler {
  constructor(
    protected readonly prisma: PrismaService
  ) {
    super(prisma);
  }

  getEventName(): string {
    return "Claimed";
  }

  async handle(
    event: any,
    contractConfig: ContractEventConfig,
    provider: JsonRpcProvider
  ): Promise<void> {
    try {
      const eventId = `${contractConfig.contractAddress.toLowerCase()}-${this.getEventName()}-${event.transactionHash}-${event.index}`;

      if (await this.isEventProcessed(eventId)) {
        this.logger.debug(`Event ${eventId} already processed`);
        return;
      }

      const block = await provider.getBlock(event.blockNumber);
      const timestamp = block.timestamp;

      const {
        buyer,
        amount,
        schedulesClaimed,
      } = event.args;

      // Save listener state
      await this.saveProcessingState(
        contractConfig.contractAddress,
        this.getEventName(),
        event.blockNumber,
        event.transactionHash,
        event.index
      );

      // Convert wei to readable format
      const weiToEth4 = (wei: bigint | string) =>
        Number(Number(formatEther(wei)).toFixed(6));

      const tokens = weiToEth4(amount);

      console.log(`Claim processed: buyer=${buyer}, amount=${tokens}, schedules=${schedulesClaimed}`);

      // First, ensure user exists (update buyer aggregate - move tokens from unclaimed to claimed)
      await this.prisma.presaleUser.upsert({
        where: { walletAddress: buyer.toLowerCase() },
        update: {
          claimed: { increment: tokens },
          unclaimed: { decrement: tokens },
          lastActivity: new Date(),
        },
        create: {
          walletAddress: buyer.toLowerCase(),
          joinDate: new Date(),
          claimed: tokens,
          lastActivity: new Date(),
        },
      });

      // Then, persist presale claim transaction (now that user exists)
      await this.prisma.presaleTx.create({
        data: {
          txHash: event.transactionHash,
          contract: contractConfig.contractAddress.toLowerCase(),
          address: buyer.toLowerCase(),
          tokenAddress: contractConfig.contractAddress.toLowerCase(),
          type: PresaleTxType.Claim,
          amount: 0, // No payment amount for claims
          stage: 0, // No stage for claims
          tokens,
          timestamp,
          usdAmount: 0, // No USD value for claims
          quote: "CLAIM", // Indicate this is a claim transaction
        },
      });

      // Create recent activity record for Claim event
      try {
        await this.prisma.recentActivity.create({
          data: {
            walletAddress: buyer.toLowerCase(),
            action: "Claimed MLC",
            activityType: "Claim",
            amount: tokens,
            usdAmount: 0,
            txHash: event.transactionHash,
            timestamp: new Date(timestamp * 1000),
          },
        });
      } catch (err) {
        this.logger.error("Failed to create activity record for Claim event", err);
      }

      // Update VestingSchedule claimed fields proportionally
      const schedules = await this.prisma.vestingSchedule.findMany({
        where: { walletAddress: buyer.toLowerCase() },
      });

      if (schedules.length > 0) {
        const totalUnclaimed = schedules.reduce(
          (sum, s) => sum + (s.totalAmount - s.claimed),
          0
        );

        if (totalUnclaimed > 0) {
          for (const schedule of schedules) {
            const scheduleUnclaimed = schedule.totalAmount - schedule.claimed;
            if (scheduleUnclaimed <= 0) continue;
            const proportion = scheduleUnclaimed / totalUnclaimed;
            const claimedForSchedule = Number((tokens * proportion).toFixed(6));
            await this.prisma.vestingSchedule.update({
              where: { id: schedule.id },
              data: {
                claimed: Math.min(
                  schedule.totalAmount,
                  schedule.claimed + claimedForSchedule
                ),
              },
            });
          }
        }
      }

      this.logger.log(
        `Presale Claimed processed: buyer=${buyer}, amount=${amount.toString?.() ?? amount}, schedulesClaimed=${schedulesClaimed.toString?.() ?? schedulesClaimed}`
      );
    } catch (error) {
      this.logger.error("Error handling Presale Claim event", error);
      throw error;
    }
  }
}