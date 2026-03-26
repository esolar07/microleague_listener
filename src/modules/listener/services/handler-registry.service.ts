import { Injectable } from "@nestjs/common";
import { IEventHandler } from "../interfaces/event-handler.interface";
import { ModuleRef } from "@nestjs/core";
import { PresaleBuyHandler } from "../handlers/presale-buy.handler";
import { PresaleClaimHandler } from "../handlers/presale-claim.handler";
import { ERC20TransferHandler } from "../handlers/erc20-transfer.handler";

@Injectable()
export class HandlerRegistryService {
  private handlers = new Map<string, IEventHandler>();

  constructor(private moduleRef: ModuleRef) {}

  async onModuleInit() {
    // Register handlers here
    await this.registerHandler(PresaleBuyHandler);
    await this.registerHandler(PresaleClaimHandler);

    // ERC20 handlers
    await this.registerHandler(ERC20TransferHandler);
  }

  private async registerHandler(handlerClass: any) {
    try {
      const handler = await this.moduleRef.get(handlerClass, { strict: false });
      this.handlers.set(handlerClass.name, handler);
    } catch (error) {
      console.error(`Failed to register handler: ${handlerClass.name}`, error);
    }
  }

  getHandler(handlerName: string): IEventHandler | undefined {
    return this.handlers.get(handlerName);
  }

  getAllHandlers(): Map<string, IEventHandler> {
    return this.handlers;
  }
}
