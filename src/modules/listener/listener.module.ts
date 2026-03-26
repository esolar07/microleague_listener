import { Module } from '@nestjs/common';
import { ListenerService } from './listener.service';
import { ListenerController } from './listener.controller';
import { ContractManagerService } from './services/contract-manager.service';
import { HandlerRegistryService } from './services/handler-registry.service';
import { PresaleBuyHandler } from './handlers/presale-buy.handler';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { PresaleClaimHandler } from './handlers/presale-claim.handler';

// New Services
import { ProviderService } from './services/provider-pool.service';
import { EventQueueService } from './services/event-queue.service';
import { ReorgDetectorService } from './services/reorg-detector.service';
import { MetricsService } from './services/metrics.service';
import { GapDetectorService } from './services/gap-detector.service';
import { ListenerMonitoringController } from './controllers/listener-monitoring.controller';

@Module({
  imports: [],
  controllers: [ListenerController, ListenerMonitoringController],
  providers: [
    ListenerService,
    HandlerRegistryService,
    ContractManagerService,

    // New Production Services
    ProviderService,
    EventQueueService,
    ReorgDetectorService,
    MetricsService,
    GapDetectorService,

    // Event Handlers
    PresaleBuyHandler,
    PresaleClaimHandler,
    // Supporting Services
    JwtService,
    UserService,
  ],
  exports: [PresaleBuyHandler, ProviderService, EventQueueService, MetricsService],
})
export class ListenerModule {}
