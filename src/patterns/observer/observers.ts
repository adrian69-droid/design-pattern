import { IPipelineObserver } from './observer.interface.js';
import { PipelineEventPayload } from '../../core/types.js';

export interface PipelineMetrics {
  totalRuns: number;
  totalSuccessSteps: number;
  totalFailedSteps: number;
  totalErrors: number;
  lastRunTimestamp?: Date;
}

/**
 * Observador concreto que calcula métricas consolidadas em tempo real.
 */
export class MetricsObserver<T = unknown> implements IPipelineObserver<T> {
  public readonly observerName = 'MetricsObserver';
  private metrics: PipelineMetrics = {
    totalRuns: 0,
    totalSuccessSteps: 0,
    totalFailedSteps: 0,
    totalErrors: 0
  };

  public onEvent(event: PipelineEventPayload<T>): void {
    if (event.eventName === 'pipeline:start') {
      this.metrics.totalRuns++;
      this.metrics.lastRunTimestamp = event.timestamp;
    } else if (event.eventName === 'pipeline:step:success') {
      this.metrics.totalSuccessSteps++;
    } else if (event.eventName === 'pipeline:step:error') {
      this.metrics.totalFailedSteps++;
      this.metrics.totalErrors++;
    }
  }

  public getMetrics(): Readonly<PipelineMetrics> {
    return { ...this.metrics };
  }

  public reset(): void {
    this.metrics = {
      totalRuns: 0,
      totalSuccessSteps: 0,
      totalFailedSteps: 0,
      totalErrors: 0
    };
  }
}

/**
 * Observador concreto que registra trilha de auditoria completa em array ou stream.
 */
export class AuditLogObserver<T = unknown> implements IPipelineObserver<T> {
  public readonly observerName = 'AuditLogObserver';
  private readonly logs: Array<{ timestamp: string; event: string; step?: string; error?: string }> = [];

  constructor(private readonly loggerFn?: (logEntry: string) => void) {}

  public onEvent(event: PipelineEventPayload<T>): void {
    const entry = {
      timestamp: event.timestamp.toISOString(),
      event: event.eventName,
      step: event.stepName,
      error: event.error?.message
    };
    this.logs.push(entry);

    if (this.loggerFn) {
      this.loggerFn(`[AUDIT] ${entry.timestamp} | ${entry.event} | Step: ${entry.step ?? 'N/A'}${entry.error ? ` | Error: ${entry.error}` : ''}`);
    }
  }

  public getAuditTrail(): ReadonlyArray<typeof this.logs[number]> {
    return [...this.logs];
  }
}
