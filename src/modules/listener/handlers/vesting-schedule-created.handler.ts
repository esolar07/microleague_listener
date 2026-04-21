import { Injectable } from "@nestjs/common";
import { formatEther, JsonRpcProvider } from "ethers";
import { BaseEventHandler } from "./base-event.handler";
import { ContractEventConfig } from "../config/listener.config";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class VestingScheduleCreatedHandler extends BaseEventHandler {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  getEventName(): string {
    return "VestingScheduleCreated";
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

      const { buyer, scheduleId, amount, startTime, cliff, duration } = event.args;

      const addedAmount = Number(Number(formatEther(amount)).toFixed(6));
      const walletAddress = buyer.toLowerCase();
      const contract = contractConfig.contractAddress.toLowerCase();
      const scheduleIdNum = Number(scheduleId);

      // Ensure PresaleUser exists before creating VestingSchedule (FK constraint)
      await this.prisma.presaleUser.upsert({
        where: { walletAddress },
        update: { lastActivity: new Date() },
        create: {
          walletAddress,
          joinDate: new Date(),
          lastActivity: new Date(),
        },
      });

      // Upsert: on conflict (same walletAddress+scheduleId+contract) just set the
      // canonical values from the event — do NOT increment, the event carries the
      // full totalAmount for this schedule as emitted by the contract.
      await this.prisma.vestingSchedule.upsert({
        where: {
          walletAddress_scheduleId_contract: {
            walletAddress,
            scheduleId: scheduleIdNum,
            contract,
          },
        },
        update: {
          // Overwrite with authoritative on-chain values in case of reprocessing
          totalAmount: addedAmount,
          startTime: Number(startTime),
          cliff: Number(cliff),
          duration: Number(duration),
        },
        create: {
          walletAddress,
          scheduleId: scheduleIdNum,
          stageId: scheduleIdNum,
          totalAmount: addedAmount,
          startTime: Number(startTime),
          cliff: Number(cliff),
          duration: Number(duration),
          releaseInterval: 0,
          claimed: 0,
          contract,
        },
      });

      // Create activity record for the recent activity feed
      try {
        const block = await provider.getBlock(event.blockNumber);
        const timestamp = block.timestamp;
        await this.prisma.recentActivity.create({
          data: {
            walletAddress,
            action: "Vesting Schedule Created",
            activityType: "Vesting_Created",
            amount: addedAmount,
            usdAmount: 0,
            txHash: event.transactionHash,
            metadata: { scheduleId: scheduleIdNum, stageId: scheduleIdNum },
            timestamp: new Date(timestamp * 1000),
          },
        });
      } catch (err) {
        this.logger.error("Failed to create activity record for VestingScheduleCreated event", err);
      }

      // Mark as processed only after the DB write succeeds
      await this.saveProcessingState(
        contractConfig.contractAddress,
        this.getEventName(),
        event.blockNumber,
        event.transactionHash,
        event.index
      );

      this.logger.log(
        `VestingScheduleCreated processed: buyer=${buyer}, scheduleId=${scheduleId}, amount=${addedAmount}`
      );
    } catch (error) {
      this.logger.error("Error handling VestingScheduleCreated event", error);
      throw error;
    }
  }
}
