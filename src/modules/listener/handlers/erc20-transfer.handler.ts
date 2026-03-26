// handlers/erc20-transfer.handler.ts
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { formatEther, JsonRpcProvider } from "ethers";

import { BaseEventHandler } from "./base-event.handler";
import { ContractEventConfig } from "../config/listener.config";
import { DB_COLLECTIONS } from "src/constants/collections";
import { StateDocument } from "../entity/listener.state.entity";

@Injectable()
export class ERC20TransferHandler extends BaseEventHandler {
  constructor(
    @InjectModel(DB_COLLECTIONS.STATE)
    stateModel: Model<StateDocument>
  ) {
    super(stateModel);
  }

  getEventName(): string {
    return "Transfer";
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

      const { from, to, value } = event.args;

      // Save listener state
      await this.saveProcessingState(
        contractConfig.contractAddress,
        this.getEventName(),
        event.blockNumber,
        event.transactionHash,
        event.index
      );

      const amount = formatEther(value);

      this.logger.log(
        `ERC20 Transfer processed: from=${from}, to=${to}, value=${amount}, txHash=${event.transactionHash}`
      );

      // TODO: Add your business logic here
      // For example: Update user balances, track transfers, etc.
    } catch (error) {
      this.logger.error("Error handling ERC20 Transfer event", error);
      throw error;
    }
  }
}
