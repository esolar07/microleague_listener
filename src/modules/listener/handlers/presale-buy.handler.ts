// handlers/presale-buy.handler.ts
import { Injectable } from "@nestjs/common";
import { formatEther, JsonRpcProvider } from "ethers";

import { BaseEventHandler } from "./base-event.handler";
import { ContractEventConfig } from "../config/listener.config";
import { PrismaService } from "src/prisma/prisma.service";
import { PresaleTxType } from "@prisma/client";
import { EmailService } from "../services/email.service";
import { PdfService } from "../services/pdf.service";

@Injectable()
export class PresaleBuyHandler extends BaseEventHandler {
  constructor(
    protected readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly pdfService: PdfService
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
      await this.prisma.presaleUser.upsert({
        where: { walletAddress: buyer.toLowerCase() },
        update: {
          tokensPurchased: { increment: tokens },
          amountSpent: { increment: usdAmount },
          unclaimed: { increment: tokens },
          lastActivity: now,
        },
        create: {
          walletAddress: buyer.toLowerCase(),
          joinDate: now,
          tokensPurchased: tokens,
          amountSpent: usdAmount,
          unclaimed: tokens,
          lastActivity: now,
        },
      });

      // Then, persist presale transaction (now that user exists)
      await this.prisma.presaleTx.upsert({
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

      // Create activity record for the recent activity feed (RecentActivity model)
      try {
        await this.prisma.recentActivity.create({
          data: {
            walletAddress: buyer.toLowerCase(),
            action: "Purchased MLC",
            activityType: "Buy",
            amount: tokens,
            usdAmount,
            txHash: event.transactionHash,
            timestamp: new Date(timestamp * 1000),
          },
        });
      } catch (err) {
        this.logger.error("Failed to create activity record for Buy event", err);
      }

      // Read stage data from contract for vesting info
      let cliffSeconds = 0;
      let durationSeconds = 0;
      let releaseIntervalSeconds = 0;
      try {
        const { Contract } = await import("ethers");
        const contract = new Contract(
          contractConfig.contractAddress,
          [
            "function getStage(uint256 id) view returns (tuple(uint256 price, uint256 offeredAmount, uint256 soldAmount, uint256 minBuyTokens, uint256 maxBuyTokens, uint256 startTime, uint256 endTime, uint256 cliff, uint256 duration, uint256 releaseInterval, bool whitelistOnly))",
          ],
          provider
        );
        const stage = await contract.getStage(stageId);
        cliffSeconds = Number(stage.cliff);
        durationSeconds = Number(stage.duration);
        releaseIntervalSeconds = Number(stage.releaseInterval);
      } catch (err) {
        this.logger.warn(`Could not read stage data for vesting info: ${err.message}`);
      }

      // Try to get user email and send SAFT certificate
      await this.sendSAFTCertificate(
        buyer.toLowerCase(),
        event.transactionHash,
        usdAmount,
        tokens,
        timestamp,
        { cliffSeconds, durationSeconds, releaseIntervalSeconds }
      );

      // Mark as processed only after all DB writes succeed
      await this.saveProcessingState(
        contractConfig.contractAddress,
        this.getEventName(),
        event.blockNumber,
        event.transactionHash,
        event.index
      );

      this.logger.log(
        `Presale Bought processed: buyer=${buyer}, tokenAmount=${tokenAmount.toString?.() ?? tokenAmount}, paymentAmount=${paymentAmount.toString?.() ?? paymentAmount}`
      );
    } catch (error) {
      this.logger.error("Error handling Presale Buy event", error);
      throw error;
    }
  }

  private async sendSAFTCertificate(
    walletAddress: string,
    txHash: string,
    amount: number,
    tokens: number,
    timestamp: number,
    vesting: { cliffSeconds: number; durationSeconds: number; releaseIntervalSeconds: number }
  ): Promise<void> {
    try {
      // Generate transaction reference
      const txRef = `MLC-${Date.now().toString(36).toUpperCase()}`;
      
      // Try to get user email from UserProfile through Wallet
      const userEmail = await this.getUserEmail(walletAddress);
      
      if (!userEmail) {
        this.logger.warn(`No email found for wallet ${walletAddress}. SAFT certificate will not be sent.`);
        return;
      }

      // Generate PDF certificate and upload to Cloudinary
      const { localPath, cloudinaryUrl } = await this.pdfService.generateSAFTCertificate(
        walletAddress,
        txHash,
        amount,
        tokens,
        txRef,
        userEmail,
        vesting
      );

      // Send email with PDF attachment
      const emailSent = await this.emailService.sendSAFTCertificate(
        userEmail,
        walletAddress,
        txHash,
        amount,
        tokens,
        txRef,
        localPath,
        vesting
      );

      if (emailSent) {
        this.logger.log(`SAFT certificate sent to ${userEmail} for transaction ${txHash}`);
      } else {
        this.logger.error(`Failed to send SAFT certificate email to ${userEmail}`);
      }

      // Always store the activity record so the download URL is available
      try {
        await this.prisma.recentActivity.create({
          data: {
            walletAddress: walletAddress.toLowerCase(),
            action: "SAFT Certificate Sent",
            activityType: "Buy",
            amount: tokens,
            usdAmount: amount,
            txHash: txHash,
            metadata: {
              email: userEmail,
              txRef: txRef,
              cloudinaryUrl: cloudinaryUrl || null,
              emailSent,
              sentAt: new Date().toISOString()
            },
            timestamp: new Date(timestamp * 1000),
          },
        });
      } catch (err) {
        this.logger.error("Failed to create SAFT activity record", err);
      }
    } catch (error) {
      this.logger.error(`Error sending SAFT certificate: ${error.message}`, error.stack);
      // Don't throw error here - we don't want to fail the entire event processing
      // just because email sending failed
    }
  }

  private async getUserEmail(walletAddress: string): Promise<string | null> {
    try {
      // Query to get email through Wallet -> User -> UserProfile
      const wallet = await this.prisma.wallet.findFirst({
        where: { address: walletAddress.toLowerCase() },
        include: {
          User: {
            include: {
              UserProfile: true
            }
          }
        }
      });

      if (wallet?.User?.UserProfile?.email) {
        return wallet.User.UserProfile.email;
      }

      // Alternative: Check if email is stored directly somewhere else
      const userProfile = await this.prisma.userProfile.findFirst({
        where: {
          OR: [
            { email: { contains: walletAddress, mode: 'insensitive' } },
            // Add other lookup methods if needed
          ]
        }
      });

      return userProfile?.email || null;
    } catch (error) {
      this.logger.error(`Error getting user email for wallet ${walletAddress}: ${error.message}`);
      return null;
    }
  }
}
