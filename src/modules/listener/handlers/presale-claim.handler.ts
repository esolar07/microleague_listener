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
      await this.prisma.user.upsert({
        where: { walletAddress: buyer.toLowerCase() },
        update: {
          claimed: { increment: tokens },
          unclaimed: { decrement: tokens },
          lastActivity: new Date(),
        },
        create: {
          userId: buyer.toLowerCase(), // Using wallet address as userId for now
          walletAddress: buyer.toLowerCase(),
          joinDate: new Date(),
          claimed: tokens,
          lastActivity: new Date(),
        },
      });

      // Then, persist presale claim transaction (now that user exists)
      await this.prisma.presaleTxs.create({
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

      this.logger.log(
        `Presale Claimed processed: buyer=${buyer}, amount=${amount.toString?.() ?? amount}, schedulesClaimed=${schedulesClaimed.toString?.() ?? schedulesClaimed}`
      );
    } catch (error) {
      this.logger.error("Error handling Presale Claim event", error);
      throw error;
    }
  }
}