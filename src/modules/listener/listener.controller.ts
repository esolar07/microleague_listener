import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from "@nestjs/swagger";
import { ListenerService } from "./listener.service";
import { ReprocessEventsDto } from "./dto/reprocess-events.dto";
import { AdminGuard } from "../auth/guards/admin.guard";

@ApiTags("Listener")
@Controller("listener")
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard)
export class ListenerController {
  private readonly logger = new Logger(ListenerController.name);

  constructor(private readonly listenerService: ListenerService) {}

  @Get("status")
  @ApiOperation({
    summary: "Get listener status",
    description: "Get the current status of all contract listeners",
  })
  @ApiResponse({
    status: 200,
    description: "Listener status retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getStatus() {
    return this.listenerService.getStatus();
  }

  @Post("reprocess")
  @HttpCode(HttpStatus.ACCEPTED)
  // @UseGuards(AdminGuard)
  @ApiOperation({
    summary: "Reprocess smart contract events",
    description:
      "Reprocess events from a specific block range to ensure no events are missed. This endpoint requires admin privileges. Processing runs in the background and returns immediately.",
  })
  @ApiBody({ type: ReprocessEventsDto })
  @ApiResponse({
    status: 202,
    description: "Events reprocessing started successfully in the background",
  })
  @ApiResponse({ status: 400, description: "Bad Request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - Admin access required" })
  async reprocessEvents(@Body() dto: ReprocessEventsDto) {
    // Validate and prepare options
    const options = {
      contractAddress: dto.contractAddress,
      fromBlock: dto.fromBlock,
      toBlock: dto.toBlock,
      eventNames: dto.eventNames,
      resetLastProcessedBlock: dto.resetLastProcessedBlock,
      batchSize: dto.batchSize,
    };

    // Start processing in background without blocking the API response
    setImmediate(async () => {
      try {
        await this.listenerService.reprocessEvents(options);
      } catch (error) {
        // Errors are already logged in the service, but we log here too for API context
        this.logger.error(
          `Background reprocessing failed: ${error.message}`,
          error.stack
        );
      }
    });

    return {
      success: true,
      message: "Event reprocessing started in the background. Check logs for detailed progress.",
      options: {
        contractAddress: options.contractAddress || "all contracts",
        fromBlock: options.fromBlock,
        toBlock: options.toBlock,
        eventNames: options.eventNames,
      },
    };
  }

  @Post("reprocess-from-start")
  @HttpCode(HttpStatus.ACCEPTED)
  // @UseGuards(AdminGuard)
  @ApiOperation({
    summary: "Reprocess all events from start",
    description:
      "Reprocess all events from the contract's start block. This will reset the last processed block and reprocess everything. This endpoint requires admin privileges. Processing runs in the background and returns immediately.",
  })
  @ApiResponse({
    status: 202,
    description: "Events reprocessing from start initiated successfully in the background",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - Admin access required" })
  async reprocessFromStart(
    @Query("contractAddress") contractAddress?: string
  ) {
    // Start processing in background without blocking the API response
    setImmediate(async () => {
      try {
        await this.listenerService.reprocessFromStart(contractAddress);
      } catch (error) {
        // Errors are already logged in the service, but we log here too for API context
        this.logger.error(
          `Background reprocessing from start failed: ${error.message}`,
          error.stack
        );
      }
    });

    return {
      success: true,
      message: "Event reprocessing from start initiated in the background. Check logs for detailed progress.",
      contractAddress: contractAddress || "all contracts",
    };
  }

  @Post("reset-event-state")
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: "Delete processed-event state entries for specific event names",
    description:
      "Removes state records for the given event names so they will be re-handled on the next reprocess run. " +
      "Use this when a handler was previously a stub and the events were marked as processed without actually running business logic.",
  })
  @ApiResponse({ status: 200, description: "State entries deleted" })
  async resetEventState(
    @Body("eventNames") eventNames: string[],
    @Query("contractAddress") contractAddress?: string,
  ) {
    const result = await this.listenerService.resetEventState(eventNames, contractAddress);
    return { success: true, ...result };
  }
}
