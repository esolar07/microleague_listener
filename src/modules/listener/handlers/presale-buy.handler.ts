// handlers/presale-buy.handler.ts
import { Injectable } from "@nestjs/common";
import { formatEther, JsonRpcProvider } from "ethers";

import { BaseEventHandler } from "./base-event.handler";
import { ContractEventConfig } from "../config/listener.config";
import { PrismaService } from "src/prisma/prisma.service";
import { PresaleTxType } from "@prisma/client";

@Injectable()
export class PresaleBuyHandler extends BaseEventHandler {
  constructor(
    protected readonly prisma: PrismaService
  ) {
    super(prisma);
  }

  getEventName(): string {
    return "Bought";
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
        paymentToken,
        paymentAmount,
        tokenAmount,
        stageId,
        usdValue,
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

      const tokens = weiToEth4(tokenAmount);
      const amount = weiToEth4(paymentAmount);
      const usdAmount = weiToEth4(usdValue);

      console.log(tokens);
      console.log(amount);
      console.log(usdAmount);

      // First, ensure user exists (create/update buyer aggregate)
      const now = new Date();
      await this.prisma.user.upsert({
        where: { walletAddress: buyer.toLowerCase() },
        update: {
          tokensPurchased: { increment: tokens },
          amountSpent: { increment: usdAmount },
          unclaimed: { increment: tokens },
          lastActivity: now,
        },
        create: {
          userId: buyer.toLowerCase(), // Using wallet address as userId for now
          walletAddress: buyer.toLowerCase(),
          joinDate: now,
          tokensPurchased: tokens,
          amountSpent: usdAmount,
          unclaimed: tokens,
          lastActivity: now,
        },
      });

      // Then, persist presale transaction (now that user exists)
      await this.prisma.presaleTxs.upsert({
        where: { txHash: event.transactionHash },
        update: {
          contract: contractConfig.contractAddress.toLowerCase(),
          address: buyer.toLowerCase(),
          tokenAddress: contractConfig.contractAddress.toLowerCase(),
          type: PresaleTxType.Buy,
          amount,
          stage: Number(stageId) || 0,
          tokens,
          timestamp,
          usdAmount,
          quote: paymentToken,
        },
        create: {
          txHash: event.transactionHash,
          contract: contractConfig.contractAddress.toLowerCase(),
          address: buyer.toLowerCase(),
          tokenAddress: contractConfig.contractAddress.toLowerCase(),
          type: PresaleTxType.Buy,
          amount,
          stage: Number(stageId) || 0,
          tokens,
          timestamp,
          usdAmount,
          quote: paymentToken,
        },
      });

      this.logger.log(
        `Presale Bought processed: buyer=${buyer}, tokenAmount=${tokenAmount.toString?.() ?? tokenAmount}, paymentAmount=${paymentAmount.toString?.() ?? paymentAmount}`
      );
    } catch (error) {
      this.logger.error("Error handling Presale Buy event", error);
      throw error;
    }
  }
}
