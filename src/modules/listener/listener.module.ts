import { Module } from '@nestjs/common';
import { ListenerService } from './listener.service';
import { ListenerController } from './listener.controller';
import { CommonModule } from 'src/modules/common/modules/common.module';
import { ContractManagerService } from './services/contract-manager.service';
import { HandlerRegistryService } from './services/handler-registry.service';
import { PresaleBuyHandler } from './handlers/presale-buy.handler';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { PresaleClaimHandler } from './handlers/presale-claim.handler';
import { AdminService } from '../admin/admin.service';
import { ERC20TransferHandler } from './handlers/erc20-transfer.handler';

// New Services
import { ProviderService } from './services/provider-pool.service';
import { EventQueueService } from './services/event-queue.service';
import { ReorgDetectorService } from './services/reorg-detector.service';
import { MetricsService } from './services/metrics.service';
import { GapDetectorService } from './services/gap-detector.service';
import { ListenerMonitoringController } from './controllers/listener-monitoring.controller';

@Module({
  imports: [CommonModule],
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
    ERC20TransferHandler,
    // Supporting Services
    AdminGuard,
    JwtService,
    UserService,
    AdminService,
  ],
  exports: [PresaleBuyHandler, ProviderService, EventQueueService, MetricsService],
})
export class ListenerModule {}
