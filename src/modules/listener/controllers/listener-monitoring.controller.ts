// controllers/listener-monitoring.controller.ts
import {
  Controller,
  Get,
  Post,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Body,
  Header,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/auth.guard';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { SkipResponseInterceptor } from 'src/decorators/skip-response-interceptor.decorator';
import { MetricsService } from '../services/metrics.service';
import { GapDetectorService } from '../services/gap-detector.service';
import { EventQueueService } from '../services/event-queue.service';
import { ProviderService } from '../services/provider-pool.service';
import { ReorgDetectorService } from '../services/reorg-detector.service';
import { ListenerService } from '../listener.service';

@ApiTags('Listener Monitoring')
@Controller('listener')
export class ListenerMonitoringController {
  constructor(
    private readonly listenerService: ListenerService,
    private readonly metricsService: MetricsService,
    private readonly gapDetectorService: GapDetectorService,
    private readonly eventQueueService: EventQueueService,
    private readonly providerService: ProviderService,
    private readonly reorgDetectorService: ReorgDetectorService
  ) {}

  // ============ PUBLIC ENDPOINTS ============

  @Get('metrics')
  @SkipResponseInterceptor()
  @Header('Content-Type', 'text/plain; charset=utf-8')
  @ApiOperation({
    summary: 'Get Prometheus metrics',
    description: 'Exposes metrics in Prometheus format for scraping',
  })
  @ApiResponse({ status: 200, description: 'Metrics in Prometheus format' })
  async getMetrics(@Res({ passthrough: false }) res: Response) {
    const metrics = await this.metricsService.getMetrics();
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(metrics);
  }

  @Get('health')
  @ApiOperation({
    summary: 'Health check endpoint',
    description: 'Returns comprehensive health status of the listener system',
  })
  @ApiResponse({ status: 200, description: 'Health status' })
  async getHealth() {
    const [status, queueStats, providerStats] = await Promise.all([
      this.listenerService.getStatus(),
      this.eventQueueService.getQueueStats(),
      Promise.resolve(this.providerService.getProviderStats()),
    ]);

    // Get current block from a healthy provider
    let latestBlock = 0;
    try {
      const provider = await this.providerService.getProvider();
      latestBlock = await provider.getBlockNumber();
    } catch (error) {
      // Ignore if no healthy provider
    }

    const health = {
      status: 'healthy',
      timestamp: new Date(),
      uptime: process.uptime(),
      system: {
        isListening: status.isListening,
        totalContracts: status.totalContracts,
        latestBlock,
      },
      contracts: status.contracts.map((contract) => ({
        ...contract,
        lag: latestBlock > 0 ? latestBlock - contract.lastProcessedBlock : 0,
        isHealthy: latestBlock > 0 ? latestBlock - contract.lastProcessedBlock < 100 : false,
      })),
      queue: queueStats,
      providers: {
        total: providerStats.length,
        healthy: providerStats.filter((p) => p.isHealthy).length,
        details: providerStats,
      },
    };

    // Determine overall health
    const unhealthyContracts = health.contracts.filter((c) => !c.isHealthy);
    const unhealthyProviders = providerStats.filter((p) => !p.isHealthy);

    if (unhealthyProviders.length === providerStats.length) {
      health.status = 'critical';
    } else if (unhealthyContracts.length > 0 || unhealthyProviders.length > 0) {
      health.status = 'degraded';
    }

    return health;
  }

  // ============ AUTHENTICATED ENDPOINTS ============

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get detailed listener status',
    description: 'Returns detailed status of all contract listeners',
  })
  @ApiResponse({ status: 200, description: 'Listener status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStatus() {
    return this.listenerService.getStatus();
  }

  @Get('queue/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get event queue statistics',
    description: 'Returns statistics about the event processing queue',
  })
  @ApiResponse({ status: 200, description: 'Queue statistics' })
  async getQueueStats() {
    return this.eventQueueService.getQueueStats();
  }

  @Get('failed-events')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get failed events',
    description: 'Returns list of events that failed processing',
  })
  @ApiQuery({ name: 'contractAddress', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  async getFailedEvents(
    @Query('contractAddress') contractAddress?: string,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number
  ) {
    return this.eventQueueService.getFailedEvents({
      contractAddress,
      limit: limit ? parseInt(limit.toString()) : 50,
      skip: skip ? parseInt(skip.toString()) : 0,
    });
  }

  @Get('gaps/detect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Detect processing gaps',
    description: 'Detects gaps in block processing for contracts',
  })
  @ApiQuery({ name: 'contractAddress', required: false })
  async detectGaps(@Query('contractAddress') contractAddress?: string) {
    if (contractAddress) {
      return this.gapDetectorService.detectGaps(contractAddress);
    }
    return this.gapDetectorService.detectGapsForAllContracts();
  }

  @Get('gaps/summary')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get gap summary',
    description: 'Returns summary statistics about processing gaps',
  })
  @ApiQuery({ name: 'contractAddress', required: false })
  async getGapSummary(@Query('contractAddress') contractAddress?: string) {
    return this.gapDetectorService.getGapSummary(contractAddress);
  }

  @Get('reorg/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get reorganization statistics',
    description: 'Returns statistics about detected blockchain reorganizations',
  })
  @ApiQuery({ name: 'contractAddress', required: false })
  async getReorgStats(@Query('contractAddress') contractAddress?: string) {
    return this.reorgDetectorService.getReorgStats(contractAddress);
  }

  @Get('providers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get RPC provider statistics',
    description: 'Returns statistics about RPC providers',
  })
  async getProviderStats() {
    return this.providerService.getProviderStats();
  }

  // ============ ADMIN ENDPOINTS ============

  @Post('retry-failed')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Retry failed events',
    description: 'Retry processing of failed events',
  })
  @ApiResponse({ status: 202, description: 'Retry initiated' })
  async retryFailedEvents(
    @Body()
    options: {
      contractAddress?: string;
      eventName?: string;
      limit?: number;
      olderThan?: Date;
    }
  ) {
    return this.eventQueueService.retryFailedEvents(options);
  }

  @Post('provider/:name/health')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Set provider health',
    description: 'Manually mark a provider as healthy or unhealthy',
  })
  async setProviderHealth(
    @Query('name') name: string,
    @Body() body: { isHealthy: boolean }
  ) {
    this.providerService.setProviderHealth(name, body.isHealthy);
    return { success: true, message: `Provider ${name} marked as ${body.isHealthy ? 'healthy' : 'unhealthy'}` };
  }

  @Post('queue/cleanup')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cleanup old queue jobs',
    description: 'Remove old completed/failed jobs from queue',
  })
  async cleanupQueue(@Query('hours') hours?: number) {
    await this.eventQueueService.cleanupOldJobs(hours ? parseInt(hours.toString()) : 24);
    return { success: true, message: 'Queue cleanup initiated' };
  }

  @Get('data-integrity/:contractAddress')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Verify data integrity',
    description: 'Check for duplicate events and data integrity issues',
  })
  async verifyDataIntegrity(@Query('contractAddress') contractAddress: string) {
    return this.gapDetectorService.verifyDataIntegrity(contractAddress);
  }
}
