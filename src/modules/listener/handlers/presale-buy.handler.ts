// handlers/presale-buy.handler.ts
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { formatEther, JsonRpcProvider, parseEther, parseUnits } from "ethers";

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
export class PresaleBuyHandler extends BaseEventHandler {
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

      // Persist presale transaction

      const weiToEth4 = (wei: bigint | string) =>
        Number(Number(formatEther(wei)).toFixed(6));

      const tokens = weiToEth4(tokenAmount);
      const amount = weiToEth4(paymentAmount);
      const usdAmount = weiToEth4(usdValue);

      console.log(tokens);
      console.log(amount);
      console.log(usdAmount);

      const doc: Partial<PresaleTxs> = {
        txHash: event.transactionHash,
        contract: contractConfig.contractAddress.toLowerCase(),
        address: buyer.toLowerCase(),
        tokenAddress: contractConfig.contractAddress.toLowerCase(),
        type: PresaleTxType.BUY,
        amount,
        stage: Number(stageId) || 0,
        tokens,
        timestamp,
        usdAmount,
        quote: paymentToken,
      };

      await this.presaleTxsModel.findOneAndUpdate(
        { txHash: event.transactionHash },
        doc,
        { upsert: true, new: true }
      );

      // Upsert/update buyer aggregate
      const now = new Date();
      await this.userModel.findOneAndUpdate(
        { walletAddress: buyer.toLowerCase() },
        {
          $setOnInsert: {
            joinDate: now,
          },
          $inc: {
            tokensPurchased: tokens,
            amountSpent: usdAmount,
            unclaimed: tokens, // assuming all new tokens start as unclaimed
          },
          $set: {
            lastActivity: now,
          },
        },
        { upsert: true, new: true }
      );

      this.logger.log(
        `Presale Bought processed: buyer=${buyer}, tokenAmount=${tokenAmount.toString?.() ?? tokenAmount}, paymentAmount=${paymentAmount.toString?.() ?? paymentAmount}`
      );
    } catch (error) {
      this.logger.error("Error handling Presale Buy event", error);
      throw error;
    }
  }
}
