import { describe, it, expect, vi } from 'vitest';
import { PipelineBuilder } from '../src/patterns/builder/pipeline.builder.js';
import { MetricsObserver, AuditLogObserver } from '../src/patterns/observer/observers.js';

describe('Design Pattern: Observer (IPipelineObserver & PipelineEventEmitter)', () => {
  it('deve notificar MetricsObserver calculando execuções e passos com sucesso', async () => {
    const metricsObserver = new MetricsObserver<number>();

    const pipeline = PipelineBuilder.create<number>('PipelineObservado')
      .subscribe(metricsObserver)
      .transform('Passo1', n => n * 2)
      .transform('Passo2', n => n + 10)
      .build();

    await pipeline.execute(5);
    await pipeline.execute(10);

    const metrics = metricsObserver.getMetrics();
    expect(metrics.totalRuns).toBe(2);
    expect(metrics.totalSuccessSteps).toBe(4);
    expect(metrics.totalErrors).toBe(0);
    expect(metrics.lastRunTimestamp).toBeDefined();
  });

  it('deve registrar trilha de auditoria via AuditLogObserver', async () => {
    const auditLogger = vi.fn();
    const auditObserver = new AuditLogObserver<string>(auditLogger);

    const pipeline = PipelineBuilder.create<string>('AuditPipeline')
      .subscribe(auditObserver)
      .transform('Formatacao', s => s.toUpperCase())
      .build();

    await pipeline.execute('teste audit');

    const auditTrail = auditObserver.getAuditTrail();
    expect(auditTrail.length).toBeGreaterThanOrEqual(3); // start, step, success, complete
    expect(auditLogger).toHaveBeenCalled();
  });
});
