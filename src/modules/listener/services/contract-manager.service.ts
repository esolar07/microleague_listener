// services/contract-manager.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { ethers } from "ethers";
import { HandlerRegistryService } from "./handler-registry.service";
import { ContractEventConfig, EventConfig } from "../config/listener.config";
import { PrismaService } from "src/prisma/prisma.service";
import { ProviderService } from "./provider-pool.service";

// Constants
const FACTORY_DEPLOYMENT_BLOCK = 10238231; // HousingPoolFactory deployment block

interface ContractInstance {
  contract: ethers.Contract;
  config: ContractEventConfig;
  listeners: Map<string, any>;
  lastProcessedBlock: number;
  isProcessingHistorical: boolean;
}

@Injectable()
export class ContractManagerService {
  private readonly logger = new Logger(ContractManagerService.name);
  private provider: ethers.JsonRpcProvider;
  private readonly contracts = new Map<string, ContractInstance>();
  private isListening = false;

  constructor(
    private readonly handlerRegistry: HandlerRegistryService,
    private readonly prisma: PrismaService,
    private readonly providerService: ProviderService
  ) { }

  async initializeProvider() {
    // Use provider pool for failover support
    this.provider = await this.providerService.getProvider();
  }

  async registerContract(config: ContractEventConfig) {
    if (!config.enabled) {
      this.logger.log(`Contract ${config.contractName} is disabled, skipping`);
      return;
    }

    try {
      const contract = new ethers.Contract(
        config.contractAddress,
        config.abi,
        this.provider
      );

      const lastProcessedBlock = await this.getLastProcessedBlock(
        config.contractAddress
      );
      // Bug fix: always resume from where we left off (lastProcessedBlock from DB).
      // Only fall back to config.startBlock when this contract has never been processed before.
      // The previous logic was inverted: it reset to the deployment block on every restart
      // whenever lastProcessedBlock was higher, causing full re-scans each boot.
      const effectiveStartBlock = lastProcessedBlock > 0
        ? lastProcessedBlock          // Resume from DB checkpoint
        : (config.startBlock || 0);   // First run: start from deployment block

      const contractInstance: ContractInstance = {
        contract,
        config,
        listeners: new Map(),
        lastProcessedBlock: effectiveStartBlock,
        isProcessingHistorical: false,
      };

      this.contracts.set(
        config.contractAddress.toLowerCase(),
        contractInstance
      );
      this.logger.log(
        `Registered contract: ${config.contractName} at ${config.contractAddress} with startBlock ${effectiveStartBlock}`
      );

      // If listener is already running, process historical events for this new contract
      if (this.isListening) {
        this.logger.log(
          `[REGISTRATION] Listener is running, will process historical events for newly registered contract: ${config.contractName}`
        );
        // Process historical events asynchronously without blocking
        this.processHistoricalEvents(contractInstance).catch((error) => {
          this.logger.error(
            `Error processing historical events for newly registered ${config.contractName}`,
            error
          );
        });
      } else {
        this.logger.log(
          `[REGISTRATION] Listener not running yet, historical events will be processed when listener starts`
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to register contract ${config.contractName}`,
        error
      );
    }
  }

  async startListening() {
    if (this.isListening) return;

    this.logger.log("Starting multi-contract event listening...");

    // Start polling service immediately without blocking
    this.isListening = true;
    this.startPollingService();

    // Process historical events in the background without blocking startup
    // Use setImmediate to defer execution to next event loop tick
    setImmediate(async () => {
      for (const instance of this.contracts.values()) {
        this.processHistoricalEvents(instance).catch((error) => {
          this.logger.error(
            `Error processing historical events for ${instance.config.contractName}`,
            error
          );
        });
      }
    });
  }

  private async processHistoricalEvents(instance: ContractInstance) {
    // Guard against duplicate concurrent calls (e.g. registerContract + startListening race).
    if (instance.isProcessingHistorical) {
      this.logger.warn(
        `[HISTORICAL] Already processing historical events for ${instance.config.contractName}, skipping duplicate call`
      );
      return;
    }
    instance.isProcessingHistorical = true;

    const { config, contract, lastProcessedBlock } = instance;
    // Bug fix: do NOT mutate the shared config object.  Setting
    // config.notification = false here would permanently disable notifications
    // for all subsequent polling events on this contract.

    try {
    this.logger.log(
      `[HISTORICAL] Starting historical event processing for ${config.contractName} from block ${lastProcessedBlock}`
    );

    const latestBlock = await this.provider.getBlockNumber();
    const totalBlocks = latestBlock - lastProcessedBlock;

    this.logger.log(
      `[HISTORICAL] Need to scan ${totalBlocks} blocks (${lastProcessedBlock} to ${latestBlock})`
    );

    // Define event processing order - ParticipantJoined MUST be processed first
    const eventOrder = [
      'ParticipantJoined',      // Process joins first
      'ContributionMade',       // Then contributions
      'ParticipantSelected',    // Then selections
      'ParticipantExcluded',    // Then exclusions
      'PoolCancelled',          // Then cancellations
      'AssetAcquired',          // Finally asset acquisitions
    ];

    // Sort events by the defined order
    const sortedEvents = config.events
      .filter(eventConfig => eventConfig.enabled && eventConfig.processPrevious)
      .sort((a, b) => {
        const indexA = eventOrder.indexOf(a.eventName);
        const indexB = eventOrder.indexOf(b.eventName);
        // If event not in order list, put it at the end
        const orderA = indexA === -1 ? 999 : indexA;
        const orderB = indexB === -1 ? 999 : indexB;
        return orderA - orderB;
      });

    // Process events sequentially in the correct order
    for (const eventConfig of sortedEvents) {
      try {
        this.logger.log(
          `[HISTORICAL] Processing historical ${eventConfig.eventName} events for ${config.contractName}`
        );

        let currentBlock = lastProcessedBlock;
        // Cap at 500 blocks — the RPC provider's hard limit per eth_getLogs call
        const batchSize = Math.min(eventConfig.batchSize || 100, 500);
        let totalEventsFound = 0;
        let consecutivePrunedErrors = 0;

        this.logger.log(
          `[HISTORICAL] Scanning ${eventConfig.eventName} from block ${currentBlock} to ${latestBlock} (batch size: ${batchSize})`
        );

        while (currentBlock < latestBlock) {
          const toBlock = Math.min(currentBlock + batchSize, latestBlock);

          try {
            const events = await contract.queryFilter(
              eventConfig.eventName,
              currentBlock,
              toBlock
            );

            consecutivePrunedErrors = 0;

            if (events.length > 0) {
              totalEventsFound += events.length;
              this.logger.log(
                `[HISTORICAL] Found ${events.length} ${eventConfig.eventName} events in blocks ${currentBlock}-${toBlock}`
              );
              await this.processEvents(events, eventConfig, config);
            }

            currentBlock = toBlock + 1;

            // Shorter delay for faster processing (200ms instead of 500ms)
            await new Promise((resolve) => setTimeout(resolve, 200));
          } catch (error) {
            this.logger.error(`[HISTORICAL] Error processing ${eventConfig.eventName} for ${config.contractName}: ${error.message}`, error.stack);
            const errMsg: string = error?.message || String(error);

            // Node doesn't have history for this range — skip it entirely
            if (errMsg.includes('pruned history unavailable') || errMsg.includes('missing trie node') || errMsg.includes('historical state unavailable')) {
              consecutivePrunedErrors++;

              // After 3 consecutive pruned batches we are deep in the pruned zone.
              // Crawling 100 blocks at a time through millions of unavailable blocks
              // would take hours and flood the logs, so jump straight to recent history.
              if (consecutivePrunedErrors >= 3) {
                const PRUNED_SAFE_BUFFER = 50_000;
                const jumpTarget = Math.max(toBlock + 1, latestBlock - PRUNED_SAFE_BUFFER);
                this.logger.warn(
                  `[HISTORICAL] Pruned zone detected for ${eventConfig.eventName} (${consecutivePrunedErrors} consecutive errors). ` +
                  `Jumping from block ${currentBlock} to ${jumpTarget} to skip unavailable history.`
                );
                currentBlock = jumpTarget;
                consecutivePrunedErrors = 0;
              } else {
                this.logger.warn(
                  `[HISTORICAL] Pruned history at blocks ${currentBlock}-${toBlock} for ${eventConfig.eventName}, skipping range`
                );
                currentBlock = toBlock + 1;
              }
              await new Promise((resolve) => setTimeout(resolve, 200));
            } else if (errMsg.includes('exceed maximum block range') || errMsg.includes('query returned more than') || errMsg.includes('Block range too large') || errMsg.includes('block range')) {
              // Batch too large — retry with half the size
              this.logger.warn(
                `[HISTORICAL] Batch too large for ${eventConfig.eventName}, retrying with smaller batch`
              );
              const smallerBatch = Math.floor(batchSize / 2);
              const smallToBlock = Math.min(currentBlock + smallerBatch, latestBlock);

              const events = await contract.queryFilter(
                eventConfig.eventName,
                currentBlock,
                smallToBlock
              );

              if (events.length > 0) {
                totalEventsFound += events.length;
                this.logger.log(
                  `[HISTORICAL] Found ${events.length} ${eventConfig.eventName} events in blocks ${currentBlock}-${smallToBlock}`
                );
                await this.processEvents(events, eventConfig, config);
              }

              currentBlock = smallToBlock + 1;
              await new Promise((resolve) => setTimeout(resolve, 200));
            } else {
              throw error;
            }
          }
        }

        this.logger.log(
          `[HISTORICAL] Completed processing ${eventConfig.eventName} for ${config.contractName} - found ${totalEventsFound} events`
        );
      } catch (error) {
        this.logger.error(
          `[HISTORICAL] Error processing ${eventConfig.eventName} for ${config.contractName}: ${error.message}`,
          error.stack
        );
      }
    }

    // Bug fix: only advance lastProcessedBlock if polling hasn't already moved
    // it past our scan end.  Overwriting with a lower value would cause the
    // next poll to re-scan old blocks unnecessarily.
    if (latestBlock > instance.lastProcessedBlock) {
      instance.lastProcessedBlock = latestBlock;
      await this.saveLastProcessedBlock(config.contractAddress, latestBlock);
    }

    this.logger.log(
      `[HISTORICAL] Finished historical event processing for ${config.contractName} - now at block ${instance.lastProcessedBlock}`
    );
    } finally {
      // Bug fix: always clear the flag so the polling loop can resume for this
      // contract even if historical processing threw an unexpected error.
      instance.isProcessingHistorical = false;
    }
  }

  private async setupRealtimeListeners(instance: ContractInstance) {
    const { config, contract } = instance;

    for (const eventConfig of config.events) {
      if (!eventConfig.enabled) continue;

      try {
        const listener = async (...args: any[]) => {
          const event = args[args.length - 1]; // Last argument is the event object
          await this.processSingleEvent(event, eventConfig, config);
        };

        contract.on(eventConfig.eventName, listener);
        instance.listeners.set(eventConfig.eventName, listener);

        this.logger.log(
          `Setup realtime listener for ${eventConfig.eventName} on ${config.contractName}`
        );
      } catch (error) {
        this.logger.error(
          `Failed to setup listener for ${eventConfig.eventName}`,
          error
        );
      }
    }
  }

  private async processEvents(
    events: any[],
    eventConfig: EventConfig,
    contractConfig: ContractEventConfig
  ) {
    const handler = this.handlerRegistry.getHandler(eventConfig.handler);

    if (!handler) {
      this.logger.warn(`Handler ${eventConfig.handler} not found`);
      return;
    }

    for (const event of events) {
      try {
        await handler.handle(event, contractConfig, this.provider);
      } catch (error) {
        this.logger.error(
          `Error processing event ${event.transactionHash}`,
          error
        );
      }
    }
  }

  private async processSingleEvent(
    event: any,
    eventConfig: EventConfig,
    contractConfig: ContractEventConfig
  ) {
    const handler = this.handlerRegistry.getHandler(eventConfig.handler);
    if (!handler) {
      this.logger.warn(`Handler ${eventConfig.handler} not found`);
      return;
    }

    try {
      await handler.handle(event, contractConfig, this.provider);
    } catch (error) {
      this.logger.error(
        `Error processing single event ${event.transactionHash}`,
        error
      );
    }
  }

  private async startPollingService() {
    const poll = async () => {
      if (!this.isListening) return;

      try {
        const latestBlock = await this.provider.getBlockNumber();

        for (const instance of this.contracts.values()) {
          // Skip contracts still running their initial historical scan to
          // avoid concurrent RPC overload and lastProcessedBlock race conditions.
          if (instance.isProcessingHistorical) continue;

          // Guard: if the stored cursor is at or beyond the chain head the RPC
          // node knows about (can happen after switching RPC endpoints or when
          // hitting a load-balanced pool where nodes are at different heights),
          // skip this cycle instead of querying a block range the node can't serve.
          if (instance.lastProcessedBlock >= latestBlock) continue;

          await this.pollContractEvents(instance, latestBlock);
        }
      } catch (error) {
        this.logger.error("Error in polling service", error);
      }

      setTimeout(poll, 3000); // 3 seconds
    };

    setTimeout(poll, 3000);
  }

  private async pollContractEvents(
    instance: ContractInstance,
    latestBlock: number
  ) {
    const { config, contract } = instance;
    const maxBlockRange = 50000; // RPC provider max block range limit

    // Capture the starting block once before iterating over event types so that
    // every event type polls the same block range.  Previously, instance.lastProcessedBlock
    // was mutated inside the inner while-loop, which caused the second and all
    // subsequent event types to start at latestBlock+1 and their while-loops to
    // never execute — meaning only the first event type was ever polled.
    const startBlock = instance.lastProcessedBlock + 1;

    // If the stored cursor is already at or past the chain head, nothing to do.
    if (startBlock > latestBlock) {
      this.logger.debug(
        `Skipping poll for ${config.contractName}: startBlock ${startBlock} > latestBlock ${latestBlock}`,
      );
      return;
    }

    // Track the earliest block where any event type encountered an error so we
    // can avoid advancing lastProcessedBlock past an unprocessed range.
    let firstFailedBlock: number | null = null;

    for (const eventConfig of config.events) {
      if (!eventConfig.enabled) continue;

      try {
        const batchSize = Math.min(eventConfig.batchSize || 10, maxBlockRange);
        let currentBlock = startBlock; // use the captured value, not instance property

        // Process in batches if the range exceeds the maximum allowed
        while (currentBlock <= latestBlock) {
          const toBlock = Math.min(currentBlock + batchSize - 1, latestBlock);

          try {
            const events = await contract.queryFilter(
              eventConfig.eventName,
              currentBlock,
              toBlock
            );

            if (events.length > 0) {
              this.logger.log(
                `Polling found ${events.length} ${eventConfig.eventName} events for ${config.contractName} in blocks ${currentBlock}-${toBlock}`
              );
              await this.processEvents(events, eventConfig, config);
            }

            // Do NOT update instance.lastProcessedBlock here — that must only
            // happen once after all event types have been processed.
            currentBlock = toBlock + 1;

            // Small delay to avoid overwhelming the RPC provider
            await new Promise((resolve) => setTimeout(resolve, 100));
          } catch (error) {
            const errMsg = error?.message || String(error);
            this.logger.error(
              `Error polling ${eventConfig.eventName} events for blocks ${currentBlock}-${toBlock}`,
            );
            this.logger.error(errMsg);

            // Record the first block that failed so we don't advance past it.
            if (firstFailedBlock === null || currentBlock < firstFailedBlock) {
              firstFailedBlock = currentBlock;
            }

            // If the RPC says the block range is beyond the chain head, stop
            // polling entirely for this event — subsequent batches will fail too.
            if (errMsg.includes('beyond current head block') || errMsg.includes('block range')) {
              this.logger.warn(
                `RPC reports blocks ${currentBlock}-${toBlock} beyond chain head. ` +
                `Will retry on next poll cycle.`,
              );
              break;
            }

            // Skip only the failed batch, not 50 000 blocks.
            currentBlock = toBlock + 1;
          }
        }
      } catch (error) {
        this.logger.error(
          `Error polling ${eventConfig.eventName} events`,
          error
        );
      }

      // Small delay between event types to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    // Only advance lastProcessedBlock up to the block before the first failure
    // so the next poll re-tries any blocks that had errors instead of skipping them.
    const safeBlock = firstFailedBlock !== null
      ? firstFailedBlock - 1
      : latestBlock;

    if (safeBlock >= startBlock) {
      instance.lastProcessedBlock = safeBlock;
      await this.saveLastProcessedBlock(config.contractAddress, safeBlock);
    }
  }

  private async getLastProcessedBlock(
    contractAddress: string
  ): Promise<number> {
    try {
      // Get from database or default
      const state = await this.prisma.listenerState.findFirst({
        where: {
          contract: contractAddress.toLowerCase(),
          type: "lastProcessedBlock",
        }
      });
      return state?.blockNumber || 0;
    } catch (error) {
      this.logger.error(
        `Error getting last processed block for ${contractAddress}`,
        error
      );
      return 0;
    }
  }

  private async saveLastProcessedBlock(
    contractAddress: string,
    blockNumber: number
  ) {
    const eventId = `${contractAddress.toLowerCase()}-lastProcessedBlock`;
    try {
      // Use findFirst + update/create instead of upsert so we don't depend on
      // the DB having the unique index on eventId (which may not be migrated yet).
      const existing = await this.prisma.listenerState.findFirst({
        where: { eventId },
      });

      if (existing) {
        await this.prisma.listenerState.update({
          where: { id: existing.id },
          data: { blockNumber, updatedAt: new Date() },
        });
      } else {
        await this.prisma.listenerState.create({
          data: {
            eventId,
            contract: contractAddress.toLowerCase(),
            type: "lastProcessedBlock",
            blockNumber,
            hash: "",
            logIndex: 0,
            processedAt: new Date(),
            eventName: "lastProcessedBlock",
            blockHash: "",
          },
        });
      }
    } catch (error) {
      this.logger.error(
        `Error saving last processed block for ${contractAddress}`,
        error
      );
    }
  }

  async stopListening() {
    this.logger.log("Stopping all contract listeners");
    this.isListening = false;

    for (const [address, instance] of this.contracts) {
      const { contract, listeners } = instance;

      for (const [eventName, listener] of listeners) {
        contract.removeListener(eventName, listener);
      }

      listeners.clear();
    }
  }

  // Health check
  getStatus() {
    const contractStatuses = Array.from(this.contracts.entries()).map(
      ([address, instance]) => ({
        address,
        name: instance.config.contractName,
        enabled: instance.config.enabled,
        lastProcessedBlock: instance.lastProcessedBlock,
        activeEvents: instance.config.events
          .filter((e) => e.enabled)
          .map((e) => e.eventName),
      })
    );

    return {
      isListening: this.isListening,
      totalContracts: this.contracts.size,
      contracts: contractStatuses,
    };
  }

  /**
   * Reprocess events from a specific block range
   * This method ensures no events are missed by reprocessing from a given start block
   */
  async reprocessEvents(options: {
    contractAddress?: string;
    fromBlock?: number;
    toBlock?: number;
    eventNames?: string[];
    resetLastProcessedBlock?: boolean;
    batchSize?: number;
  }): Promise<{
    success: boolean;
    message: string;
    processed: {
      contractAddress: string;
      contractName: string;
      eventsProcessed: number;
      blocksProcessed: number;
      fromBlock: number;
      toBlock: number;
    }[];
  }> {
    const {
      contractAddress,
      fromBlock,
      toBlock,
      eventNames,
      resetLastProcessedBlock = false,
      batchSize,
    } = options;

    this.logger.log(
      `Starting event reprocessing: ${contractAddress || "all contracts"}`
    );

    const results: {
      contractAddress: string;
      contractName: string;
      eventsProcessed: number;
      blocksProcessed: number;
      fromBlock: number;
      toBlock: number;
    }[] = [];

    try {
      // Determine which contracts to process
      const contractsToProcess = contractAddress
        ? [this.contracts.get(contractAddress.toLowerCase())].filter(Boolean)
        : Array.from(this.contracts.values());

      if (contractsToProcess.length === 0) {
        throw new Error(
          contractAddress
            ? `Contract ${contractAddress} not found or not registered`
            : "No contracts registered"
        );
      }

      const latestBlock = await this.provider.getBlockNumber();

      for (const instance of contractsToProcess) {
        const { config, contract } = instance;

        if (!config.enabled) {
          this.logger.log(
            `Skipping disabled contract: ${config.contractName}`
          );
          continue;
        }

        // Determine start block
        let startBlock = fromBlock;
        if (startBlock === undefined) {
          // For pool contracts during reprocessFromStart, use factory deployment block
          if (resetLastProcessedBlock && config.contractName.startsWith('HOUSING_POOL_LLC_')) {
            startBlock = FACTORY_DEPLOYMENT_BLOCK;
            this.logger.log(
              `Using factory deployment block ${FACTORY_DEPLOYMENT_BLOCK} for pool contract ${config.contractName}`
            );
          } else {
            startBlock = config.startBlock || 0;
          }
        }

        // Determine end block
        const endBlock = toBlock !== undefined ? Math.min(toBlock, latestBlock) : latestBlock;

        if (startBlock > endBlock) {
          this.logger.warn(
            `Invalid block range for ${config.contractName}: ${startBlock} > ${endBlock}`
          );
          continue;
        }

        // Reset last processed block if requested
        if (resetLastProcessedBlock) {
          instance.lastProcessedBlock = startBlock - 1;
          await this.saveLastProcessedBlock(config.contractAddress, startBlock - 1);
          this.logger.log(
            `Reset last processed block for ${config.contractName} to ${startBlock - 1}`
          );
        }

        let totalEventsProcessed = 0;
        const initialBlock = startBlock;

        // Process each enabled event
        for (const eventConfig of config.events) {
          // Skip if event is not enabled
          if (!eventConfig.enabled) {
            continue;
          }

          // Skip if specific event names are provided and this event is not in the list
          if (eventNames && eventNames.length > 0 && !eventNames.includes(eventConfig.eventName)) {
            continue;
          }

          try {
            this.logger.log(
              `Reprocessing ${eventConfig.eventName} events for ${config.contractName} from block ${startBlock} to ${endBlock}`
            );

            const effectiveBatchSize = batchSize || eventConfig.batchSize || 10;
            let currentBlock = startBlock;

            while (currentBlock <= endBlock) {
              const toBlockInBatch = Math.min(
                currentBlock + effectiveBatchSize - 1,
                endBlock
              );

              try {
                const events = await contract.queryFilter(
                  eventConfig.eventName,
                  currentBlock,
                  toBlockInBatch
                );

                if (events.length > 0) {
                  this.logger.log(
                    `Found ${events.length} ${eventConfig.eventName} events in blocks ${currentBlock}-${toBlockInBatch} for ${config.contractName}`
                  );
                  await this.processEvents(events, eventConfig, config);
                  totalEventsProcessed += events.length;
                }

                // Update last processed block
                instance.lastProcessedBlock = toBlockInBatch;
                await this.saveLastProcessedBlock(
                  config.contractAddress,
                  toBlockInBatch
                );

                currentBlock = toBlockInBatch + 1;

                // Rate limiting to avoid overwhelming the RPC provider (500ms for free tier)
                await new Promise((resolve) => setTimeout(resolve, 500));
              } catch (error) {
                this.logger.error(
                  `Error processing blocks ${currentBlock}-${toBlockInBatch} for ${eventConfig.eventName}: ${error.message}`
                );
                // Continue with next batch instead of failing completely
                currentBlock = toBlockInBatch + 1;
              }
            }

            this.logger.log(
              `Completed reprocessing ${eventConfig.eventName} for ${config.contractName}: ${totalEventsProcessed} events processed`
            );
          } catch (error) {
            this.logger.error(
              `Error reprocessing ${eventConfig.eventName} for ${config.contractName}: ${error.message}`,
              error.stack
            );
          }
        }

        results.push({
          contractAddress: config.contractAddress,
          contractName: config.contractName,
          eventsProcessed: totalEventsProcessed,
          blocksProcessed: endBlock - initialBlock + 1,
          fromBlock: initialBlock,
          toBlock: endBlock,
        });
      }

      this.logger.log(
        `Event reprocessing completed. Processed ${results.length} contract(s)`
      );

      return {
        success: true,
        message: `Successfully reprocessed events for ${results.length} contract(s)`,
        processed: results,
      };
    } catch (error) {
      this.logger.error(`Error in reprocessEvents: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Reprocess all events from the start
   * - For pool contracts: starts from factory deployment block (10238231)
   * - For other contracts: starts from their configured startBlock
   */
  async reprocessFromStart(contractAddress?: string): Promise<{
    success: boolean;
    message: string;
    processed: {
      contractAddress: string;
      contractName: string;
      eventsProcessed: number;
      blocksProcessed: number;
      fromBlock: number;
      toBlock: number;
    }[];
  }> {
    this.logger.log(
      `Reprocessing from start for ${contractAddress || 'all contracts'}. Pool contracts will use factory deployment block.`
    );
    
    return this.reprocessEvents({
      contractAddress,
      resetLastProcessedBlock: true,
    });
  }
}
