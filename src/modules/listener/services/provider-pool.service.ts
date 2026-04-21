// services/provider-pool.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { JsonRpcProvider } from 'ethers';

interface ProviderInfo {
  provider: JsonRpcProvider;
  url: string;
  name: string;
  priority: number;
  isHealthy: boolean;
  consecutiveFailures: number;
  lastHealthCheck: Date;
  totalRequests: number;
  totalFailures: number;
  averageResponseTime: number;
}

@Injectable()
export class ProviderService implements OnModuleInit {
  private readonly logger = new Logger(ProviderService.name);
  private providers: ProviderInfo[] = [];
  private currentProviderIndex = 0;
  private readonly MAX_CONSECUTIVE_FAILURES = 3;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
  private readonly PROVIDER_TIMEOUT = 10000; // 10 seconds
  private healthCheckInterval: NodeJS.Timeout;
  private initialized = false;
  private initializing: Promise<void> | null = null;

  async onModuleInit() {
    // Don't throw on init, use lazy initialization
    try {
      await this.initializeProviders();
      this.startHealthChecks();
    } catch (error) {
      this.logger.warn(`Provider pool initialization deferred: ${error.message}`);
    }
  }

  private async initializeProviders() {
    if (this.initialized) return;

    const rpcUrls = [
      { url: process.env.RPC_URL_PRIMARY, name: 'primary' },
      { url: process.env.RPC_URL_SECONDARY, name: 'secondary' },
      { url: process.env.RPC_URL_TERTIARY, name: 'tertiary' },
    ].filter((config) => config.url);

    if (rpcUrls.length === 0) {
      throw new Error('No RPC URLs configured. Please set RPC_URL_PRIMARY at minimum.');
    }

    this.providers = rpcUrls.map((config, index) => ({
      provider: new JsonRpcProvider(config.url, undefined, {
        staticNetwork: true, // Optimize for performance
        batchMaxCount: 100,
      }),
      url: config.url,
      name: config.name,
      priority: index,
      isHealthy: true,
      consecutiveFailures: 0,
      lastHealthCheck: new Date(),
      totalRequests: 0,
      totalFailures: 0,
      averageResponseTime: 0,
    }));

    this.initialized = true;
    this.logger.log(`Initialized ${this.providers.length} RPC provider(s)`);

    // Initial health check
    await this.performHealthChecks();
  }

  /**
   * Ensure providers are initialized (lazy initialization)
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    // Prevent multiple concurrent initialization attempts
    if (this.initializing) {
      await this.initializing;
      return;
    }

    this.initializing = this.initializeProviders();
    try {
      await this.initializing;
      if (!this.healthCheckInterval) {
        this.startHealthChecks();
      }
    } finally {
      this.initializing = null;
    }
  }

  /**
   * Get a healthy provider using round-robin strategy
   */
  async getProvider(): Promise<JsonRpcProvider> {
    // Lazy initialization
    await this.ensureInitialized();

    const healthyProviders = this.providers.filter((p) => p.isHealthy);

    if (healthyProviders.length === 0) {
      this.logger.error('⚠️ No healthy RPC providers available! Attempting to use any provider...');
      // Fallback: try any provider if all are marked unhealthy
      if (this.providers.length > 0) {
        return this.providers[0].provider;
      }
      throw new Error('No RPC providers available');
    }

    // Round-robin selection
    const provider = healthyProviders[this.currentProviderIndex % healthyProviders.length];
    this.currentProviderIndex++;

    return provider.provider;
  }

  /**
   * Execute operation with automatic failover and retry logic
   */
  async executeWithFallback<T>(
    operation: (provider: JsonRpcProvider) => Promise<T>,
    maxRetries = 3,
    operationName = 'RPC call'
  ): Promise<T> {
    let lastError: Error;
    const healthyProviders = this.providers.filter((p) => p.isHealthy);

    if (healthyProviders.length === 0) {
      this.logger.warn('No healthy providers, attempting with all providers');
    }

    const providersToTry = healthyProviders.length > 0 ? healthyProviders : this.providers;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      for (const providerInfo of providersToTry) {
        const startTime = Date.now();

        try {
          providerInfo.totalRequests++;

          // Add timeout to operation
          const result = await Promise.race([
            operation(providerInfo.provider),
            this.timeoutPromise<T>(this.PROVIDER_TIMEOUT),
          ]);

          // Success - update metrics
          const responseTime = Date.now() - startTime;
          this.updateResponseTime(providerInfo, responseTime);
          providerInfo.consecutiveFailures = 0;
          providerInfo.isHealthy = true;

          this.logger.debug(
            `${operationName} succeeded via ${providerInfo.name} (${responseTime}ms)`
          );

          return result;
        } catch (error) {
          const responseTime = Date.now() - startTime;
          lastError = error;

          providerInfo.totalFailures++;
          providerInfo.consecutiveFailures++;

          this.logger.warn(
            `${operationName} failed via ${providerInfo.name} (attempt ${attempt + 1}/${maxRetries}): ${error.message}`
          );

          // Mark provider as unhealthy if too many consecutive failures
          if (providerInfo.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
            providerInfo.isHealthy = false;
            this.logger.error(
              `Provider ${providerInfo.name} marked as unhealthy after ${providerInfo.consecutiveFailures} consecutive failures`
            );
          }

          // Check if this is a rate limit error
          if (this.isRateLimitError(error)) {
            this.logger.warn(`Rate limit detected on ${providerInfo.name}, trying next provider`);
            continue; // Try next provider immediately
          }

          // Wait before retry (exponential backoff)
          if (attempt < maxRetries - 1) {
            await this.wait(Math.min(Math.pow(2, attempt) * 1000, 5000));
          }
        }
      }
    }

    throw new Error(
      `All providers failed after ${maxRetries} attempts. Last error: ${lastError?.message}`
    );
  }

  /**
   * Perform health checks on all providers
   */
  private async performHealthChecks() {
    this.logger.debug('Performing health checks on all providers...');

    await Promise.all(
      this.providers.map(async (providerInfo) => {
        try {
          const startTime = Date.now();

          // Try to get block number as health check
          const blockNumber = await Promise.race([
            providerInfo.provider.getBlockNumber(),
            this.timeoutPromise<number>(this.PROVIDER_TIMEOUT),
          ]);

          const responseTime = Date.now() - startTime;

          if (blockNumber > 0) {
            providerInfo.isHealthy = true;
            providerInfo.consecutiveFailures = 0;
            this.updateResponseTime(providerInfo, responseTime);

            this.logger.debug(
              `✓ ${providerInfo.name} healthy (block: ${blockNumber}, latency: ${responseTime}ms)`
            );
          }
        } catch (error) {
          providerInfo.consecutiveFailures++;

          this.logger.warn(
            `✗ ${providerInfo.name} health check failed: ${error.message}`
          );

          if (providerInfo.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
            providerInfo.isHealthy = false;
            this.logger.error(
              `Provider ${providerInfo.name} marked as unhealthy`
            );
          }
        } finally {
          providerInfo.lastHealthCheck = new Date();
        }
      })
    );

    const healthyCount = this.providers.filter((p) => p.isHealthy).length;
    this.logger.log(`Health check complete: ${healthyCount}/${this.providers.length} providers healthy`);
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks() {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, this.HEALTH_CHECK_INTERVAL);

    this.logger.log(`Health checks scheduled every ${this.HEALTH_CHECK_INTERVAL / 1000}s`);
  }

  /**
   * Stop health checks (cleanup)
   */
  onModuleDestroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }

  /**
   * Get provider statistics
   */
  getProviderStats() {
    return this.providers.map((p) => ({
      name: p.name,
      url: this.maskUrl(p.url),
      isHealthy: p.isHealthy,
      consecutiveFailures: p.consecutiveFailures,
      totalRequests: p.totalRequests,
      totalFailures: p.totalFailures,
      failureRate: p.totalRequests > 0 ? (p.totalFailures / p.totalRequests * 100).toFixed(2) + '%' : '0%',
      averageResponseTime: Math.round(p.averageResponseTime) + 'ms',
      lastHealthCheck: p.lastHealthCheck,
    }));
  }

  /**
   * Manually mark a provider as healthy/unhealthy
   */
  setProviderHealth(providerName: string, isHealthy: boolean) {
    const provider = this.providers.find((p) => p.name === providerName);
    if (provider) {
      provider.isHealthy = isHealthy;
      if (isHealthy) {
        provider.consecutiveFailures = 0;
      }
      this.logger.log(`Provider ${providerName} manually set to ${isHealthy ? 'healthy' : 'unhealthy'}`);
    }
  }

  // Helper methods
  private updateResponseTime(providerInfo: ProviderInfo, responseTime: number) {
    // Calculate rolling average
    const alpha = 0.2; // Weight for new value
    if (providerInfo.averageResponseTime === 0) {
      providerInfo.averageResponseTime = responseTime;
    } else {
      providerInfo.averageResponseTime =
        alpha * responseTime + (1 - alpha) * providerInfo.averageResponseTime;
    }
  }

  private isRateLimitError(error: any): boolean {
    return (
      error?.code === 'RATE_LIMIT_EXCEEDED' ||
      error?.status === 429 ||
      error?.message?.toLowerCase().includes('rate limit') ||
      error?.message?.toLowerCase().includes('too many requests')
    );
  }

  private timeoutPromise<T>(ms: number): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Operation timeout')), ms);
    });
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private maskUrl(url: string): string {
    // Mask API keys in URLs for logging
    return url.replace(/\/([a-zA-Z0-9]{20,})/g, '/***');
  }
}
