// services/metrics.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private registry: Registry;

  // Counters
  private eventsProcessedCounter: Counter;
  private eventsFailedCounter: Counter;
  private reorgsDetectedCounter: Counter;
  private rpcCallsCounter: Counter;

  // Gauges
  private currentBlockGauge: Gauge;
  private processingLagGauge: Gauge;
  private queueSizeGauge: Gauge;
  private healthyProvidersGauge: Gauge;

  // Histograms
  private eventProcessingDuration: Histogram;
  private rpcCallDuration: Histogram;
  private blockProcessingDuration: Histogram;

  constructor() {
    this.registry = new Registry();
    this.initializeMetrics();
    this.collectDefaultMetrics();
  }

  private initializeMetrics() {
    // COUNTERS
    this.eventsProcessedCounter = new Counter({
      name: 'blockchain_events_processed_total',
      help: 'Total number of blockchain events processed',
      labelNames: ['contract', 'event', 'status'],
      registers: [this.registry],
    });

    this.eventsFailedCounter = new Counter({
      name: 'blockchain_events_failed_total',
      help: 'Total number of failed event processing attempts',
      labelNames: ['contract', 'event', 'error_type'],
      registers: [this.registry],
    });

    this.reorgsDetectedCounter = new Counter({
      name: 'blockchain_reorgs_detected_total',
      help: 'Total number of blockchain reorganizations detected',
      labelNames: ['contract'],
      registers: [this.registry],
    });

    this.rpcCallsCounter = new Counter({
      name: 'blockchain_rpc_calls_total',
      help: 'Total number of RPC calls made',
      labelNames: ['provider', 'method', 'status'],
      registers: [this.registry],
    });

    // GAUGES
    this.currentBlockGauge = new Gauge({
      name: 'blockchain_current_block',
      help: 'Current block number being processed',
      labelNames: ['contract'],
      registers: [this.registry],
    });

    this.processingLagGauge = new Gauge({
      name: 'blockchain_processing_lag_blocks',
      help: 'Number of blocks behind the chain tip',
      labelNames: ['contract'],
      registers: [this.registry],
    });

    this.queueSizeGauge = new Gauge({
      name: 'blockchain_event_queue_size',
      help: 'Current size of event processing queue',
      labelNames: ['queue_type', 'status'],
      registers: [this.registry],
    });

    this.healthyProvidersGauge = new Gauge({
      name: 'blockchain_healthy_providers',
      help: 'Number of healthy RPC providers',
      registers: [this.registry],
    });

    // HISTOGRAMS
    this.eventProcessingDuration = new Histogram({
      name: 'blockchain_event_processing_duration_seconds',
      help: 'Time taken to process an event',
      labelNames: ['contract', 'event'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
      registers: [this.registry],
    });

    this.rpcCallDuration = new Histogram({
      name: 'blockchain_rpc_call_duration_seconds',
      help: 'Time taken for RPC calls',
      labelNames: ['method', 'provider'],
      buckets: [0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    this.blockProcessingDuration = new Histogram({
      name: 'blockchain_block_processing_duration_seconds',
      help: 'Time taken to process a block',
      labelNames: ['contract'],
      buckets: [1, 5, 10, 30, 60, 120, 300],
      registers: [this.registry],
    });

    this.logger.log('Prometheus metrics initialized');
  }

  private collectDefaultMetrics() {
    // Collect default Node.js metrics
    collectDefaultMetrics({ register: this.registry });
  }

  // === COUNTER METHODS ===

  incrementEventsProcessed(contract: string, event: string, status: 'success' | 'failed' = 'success') {
    this.eventsProcessedCounter.inc({ contract, event, status });
  }

  incrementEventsFailed(contract: string, event: string, errorType: string) {
    this.eventsFailedCounter.inc({ contract, event, error_type: errorType });
  }

  incrementReorgs(contract: string = 'all') {
    this.reorgsDetectedCounter.inc({ contract });
  }

  incrementRpcCalls(provider: string, method: string, status: 'success' | 'failed') {
    this.rpcCallsCounter.inc({ provider, method, status });
  }

  // === GAUGE METHODS ===

  setCurrentBlock(contract: string, block: number) {
    this.currentBlockGauge.set({ contract }, block);
  }

  setProcessingLag(contract: string, lag: number) {
    this.processingLagGauge.set({ contract }, lag);
  }

  setQueueSize(queueType: string, status: string, size: number) {
    this.queueSizeGauge.set({ queue_type: queueType, status }, size);
  }

  setHealthyProviders(count: number) {
    this.healthyProvidersGauge.set(count);
  }

  // === HISTOGRAM METHODS ===

  recordEventProcessingTime(contract: string, event: string, durationSeconds: number) {
    this.eventProcessingDuration.observe({ contract, event }, durationSeconds);
  }

  recordRpcCallTime(method: string, provider: string, durationSeconds: number) {
    this.rpcCallDuration.observe({ method, provider }, durationSeconds);
  }

  recordBlockProcessingTime(contract: string, durationSeconds: number) {
    this.blockProcessingDuration.observe({ contract }, durationSeconds);
  }

  // === UTILITY METHODS ===

  /**
   * Start timer for measuring duration
   */
  startTimer() {
    return Date.now();
  }

  /**
   * Calculate duration in seconds from timer
   */
  calculateDuration(startTime: number): number {
    return (Date.now() - startTime) / 1000;
  }

  /**
   * Export metrics for Prometheus scraping
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Get metrics as JSON (for debugging/API)
   */
  async getMetricsJSON() {
    const metrics = await this.registry.getMetricsAsJSON();
    return metrics;
  }

  /**
   * Reset all metrics (for testing)
   */
  resetMetrics() {
    this.registry.resetMetrics();
    this.logger.log('All metrics reset');
  }

  /**
   * Get registry (for custom metrics)
   */
  getRegistry(): Registry {
    return this.registry;
  }
}
