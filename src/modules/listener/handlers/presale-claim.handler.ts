import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { formatEther, JsonRpcProvider } from "ethers";

import { BaseEventHandler } from "./base-event.handler";
import { ContractEventConfig } from "../config/listener.config";
import { DB_COLLECTIONS } from "src/constants/collections";
import { StateDocument } from "../entity/listener.state.entity";
import {
  PresaleTxs,
  PresaleTxsDocument,
  PresaleTxType,
} from "src/modules/transactions/entities/presale.entity";
import { User } from "src/modules/user/entities/user.entity";

@Injectable()
export class PresaleClaimHandler extends BaseEventHandler {
  constructor(
    @InjectModel(DB_COLLECTIONS.STATE)
    stateModel: Model<StateDocument>,
    @InjectModel(DB_COLLECTIONS.PRE_SALES_TXS)
    private readonly presaleTxsModel: Model<PresaleTxsDocument>,
    @InjectModel(DB_COLLECTIONS.USERS)
    private readonly userModel: Model<User>
  ) {
    super(stateModel);
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

      const { buyer, amount, schedulesClaimed } = event.args;

      // Save listener state (idempotency)
      await this.saveProcessingState(
        contractConfig.contractAddress,
        this.getEventName(),
        event.blockNumber,
        event.transactionHash,
        event.index
      );

      const weiToEth4 = (wei: bigint | string) =>
        Number(Number(formatEther(wei)).toFixed(6));

      const tokensClaimed = weiToEth4(amount);
      const schedules = Number(schedulesClaimed) || 0;

      const doc: Partial<PresaleTxs> = {
        txHash: event.transactionHash,
        contract: contractConfig.contractAddress.toLowerCase(),
        address: buyer.toLowerCase(),
        tokenAddress: contractConfig.contractAddress.toLowerCase(),
        type: PresaleTxType.CLAIM,
        amount: 0, // claim has no payment amount
        stage: schedules, // store schedules claimed in stage field for reference
        tokens: tokensClaimed,
        timestamp,
        usdAmount: 0,
        quote: "",
      };

      await this.presaleTxsModel.findOneAndUpdate(
        { txHash: event.transactionHash },
        doc,
        { upsert: true, new: true }
      );

      // Update buyer aggregates: move tokens from unclaimed to claimed
      const now = new Date();
      await this.userModel.findOneAndUpdate(
        { walletAddress: buyer.toLowerCase() },
        {
          $setOnInsert: {
            joinDate: now,
          },
          $inc: {
            claimed: tokensClaimed,
            unclaimed: -tokensClaimed,
          },
          $set: {
            lastActivity: now,
          },
        },
        { upsert: true, new: true }
      );

      this.logger.log(
        `Presale Claimed processed: buyer=${buyer}, amount=${amount.toString?.() ?? amount}, schedulesClaimed=${schedulesClaimed.toString?.() ?? schedulesClaimed}`
      );
    } catch (error) {
      this.logger.error("Error handling Presale Claim event", error);
      throw error;
    }
  }
}

