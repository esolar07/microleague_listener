// main listener service
import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ContractManagerService } from "./services/contract-manager.service";
import { HandlerRegistryService } from "./services/handler-registry.service";
import { ProviderService } from "./services/provider-pool.service";
import { LISTENER_CONFIG, ContractEventConfig } from "./config/listener.config";
import { DB_COLLECTIONS } from "src/constants/collections";
import { StateDocument } from "./entity/listener.state.entity";
import HOUSING_POOL_LLC_ABI from "./abis/housingPoolLLC";

@Injectable()
export class ListenerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ListenerService.name);

  constructor(
    private readonly contractManager: ContractManagerService,
    private readonly handlerRegistry: HandlerRegistryService,
    private readonly providerPoolService: ProviderService,
    @InjectModel(DB_COLLECTIONS.STATE)
    private readonly stateModel: Model<StateDocument>,
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
    const filter: Record<string, any> = { eventName: { $in: eventNames } };
    if (contractAddress) {
      filter.contract = contractAddress.toLowerCase();
    }
    const result = await this.stateModel.deleteMany(filter);
    return { deleted: result.deletedCount };
  }
}
