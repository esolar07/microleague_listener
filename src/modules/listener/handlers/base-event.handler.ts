// handlers/base-event.handler.ts
import { Logger } from "@nestjs/common";
import { IEventHandler } from "../interfaces/event-handler.interface";
import { ContractEventConfig } from "../config/listener.config";
import { JsonRpcProvider } from "ethers";
import { InjectModel } from "@nestjs/mongoose";
import { DB_COLLECTIONS } from "src/constants/collections";
import { Model } from "mongoose";
import { StateDocument } from "../entity/listener.state.entity";

export abstract class BaseEventHandler implements IEventHandler {
  protected logger = new Logger(this.constructor.name);

  constructor(
    @InjectModel(DB_COLLECTIONS.STATE) readonly stateModel: Model<StateDocument>
  ) {}

  abstract handle(
    event: any,
    contractConfig: ContractEventConfig,
    provider: JsonRpcProvider
  ): Promise<void>;
  abstract getEventName(): string;

  protected async saveProcessingState(
    contractAddress: string,
    eventName: string,
    blockNumber: number,
    transactionHash: string,
    logIndex: number
  ): Promise<string> {
    const eventId = `${contractAddress.toLowerCase()}-${eventName}-${transactionHash}-${logIndex}`;

    // Save to your state tracking collection
    await this.stateModel.findOneAndUpdate(
      { eventId },
      {
        contract: contractAddress.toLowerCase(),
        eventName,
        blockNumber,
        transactionHash,
        logIndex,
        processedAt: new Date(),
        eventId,
      },
      { upsert: true }
    );

    return eventId;
  }

  protected async isEventProcessed(eventId: string): Promise<boolean> {
    // Check if event was already processed
    const existingEvent = await this.stateModel.findOne({ eventId });
    return !!existingEvent;
  }
}
