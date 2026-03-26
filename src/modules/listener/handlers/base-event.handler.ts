// handlers/base-event.handler.ts
import { Logger } from "@nestjs/common";
import { IEventHandler } from "../interfaces/event-handler.interface";
import { ContractEventConfig } from "../config/listener.config";
import { JsonRpcProvider } from "ethers";
import { PrismaService } from "src/prisma/prisma.service";

export abstract class BaseEventHandler implements IEventHandler {
  protected logger = new Logger(this.constructor.name);

  constructor(
    protected readonly prisma: PrismaService
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
    await this.prisma.listenerState.upsert({
      where: { eventId },
      update: {
        contract: contractAddress.toLowerCase(),
        eventName,
        blockNumber,
        hash: transactionHash,
        logIndex,
        processedAt: new Date(),
        type: eventName,
        blockHash: '', // We'll need to get this from the event if needed
      },
      create: {
        eventId,
        contract: contractAddress.toLowerCase(),
        eventName,
        blockNumber,
        hash: transactionHash,
        logIndex,
        processedAt: new Date(),
        type: eventName,
        blockHash: '', // We'll need to get this from the event if needed
      },
    });

    return eventId;
  }

  protected async isEventProcessed(eventId: string): Promise<boolean> {
    // Check if event was already processed
    const existingEvent = await this.prisma.listenerState.findUnique({
      where: { eventId }
    });
    return !!existingEvent;
  }
}
