import { Module } from '@nestjs/common';
import { ListenerService } from './listener.service';
import { ListenerController } from './listener.controller';
import { ContractManagerService } from './services/contract-manager.service';
import { HandlerRegistryService } from './services/handler-registry.service';
import { PresaleBuyHandler } from './handlers/presale-buy.handler';
import { PresaleClaimHandler } from './handlers/presale-claim.handler';
import { VestingScheduleCreatedHandler } from './handlers/vesting-schedule-created.handler';
import { AuthModule } from '../auth/auth.module';

// New Services
import { ProviderService } from './services/provider-pool.service';
import { EventQueueService } from './services/event-queue.service';
import { ReorgDetectorService } from './services/reorg-detector.service';
import { MetricsService } from './services/metrics.service';
import { GapDetectorService } from './services/gap-detector.service';
import { ListenerMonitoringController } from './controllers/listener-monitoring.controller';

// Email and PDF Services
import { EmailService } from './services/email.service';
import { PdfService } from './services/pdf.service';

// SAFT Controller
import { SaftController } from './controllers/saft.controller';

@Module({
  imports: [AuthModule],
  controllers: [ListenerController, ListenerMonitoringController, SaftController],
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

    // Email and PDF Services
    EmailService,
    PdfService,

    // Event Handlers
    PresaleBuyHandler,
    PresaleClaimHandler,
    VestingScheduleCreatedHandler,
  ],
  exports: [ListenerService, PresaleBuyHandler, VestingScheduleCreatedHandler, ProviderService, EventQueueService, MetricsService],
})
export class ListenerModule {}
