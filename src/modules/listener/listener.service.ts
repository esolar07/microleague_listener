// main listener service
import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { ContractManagerService } from "./services/contract-manager.service";
import { HandlerRegistryService } from "./services/handler-registry.service";
import { ProviderService } from "./services/provider-pool.service";
import { LISTENER_CONFIG } from "./config/listener.config";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class ListenerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ListenerService.name);

  constructor(
    private readonly contractManager: ContractManagerService,
    private readonly handlerRegistry: HandlerRegistryService,
    private readonly providerPoolService: ProviderService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    this.logger.log("Initializing Multi-Contract Event Listener");

    try {
      // Initialize provider
      await this.contractManager.initializeProvider();

      // Initialize handlers
      await this.handlerRegistry.onModuleInit();

      // Register all contracts from config
      for (const contractConfig of LISTENER_CONFIG) {
        await this.contractManager.registerContract(contractConfig);
      }

      // Start listening (non-blocking - historical events processed in background)
      this.contractManager.startListening().catch((error) => {
        this.logger.error("Error starting listener", error);
      });

      this.logger.log("Multi-Contract Event Listener initialized successfully");
    } catch (error) {
      this.logger.error(
        "Failed to initialize Multi-Contract Event Listener",
        error,
      );
    }
  }

  async onModuleDestroy() {
    await this.contractManager.stopListening();
  }

  // Public methods for manual control
  async getStatus() {
    return this.contractManager.getStatus();
  }

  async reprocessEvents(options: {
    contractAddress?: string;
    fromBlock?: number;
    toBlock?: number;
    eventNames?: string[];
    resetLastProcessedBlock?: boolean;
    batchSize?: number;
  }) {
    return this.contractManager.reprocessEvents(options);
  }

  async reprocessFromStart(contractAddress?: string) {
    return this.contractManager.reprocessFromStart(contractAddress);
  }

  /**
   * Delete processed-event state entries for the given event names so they
   * can be re-handled on the next reprocess run.
   */
  async resetEventState(
    eventNames: string[],
    contractAddress?: string,
  ): Promise<{ deleted: number }> {
    const where: any = { eventName: { in: eventNames } };
    if (contractAddress) {
      where.contract = contractAddress.toLowerCase();
    }
    
    const result = await this.prisma.listenerState.deleteMany({ where });
    return { deleted: result.count };
  }
}