import { JsonRpcProvider } from "ethers";
import { ContractEventConfig } from "../config/listener.config";

// interfaces/event-handler.interface.ts
export interface IEventHandler {
  handle(
    event: any,
    contractConfig: ContractEventConfig,
    provider: JsonRpcProvider
  ): Promise<void>;
  getEventName(): string;
}
