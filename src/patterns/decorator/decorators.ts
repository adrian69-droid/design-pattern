import { StepDecorator } from './step.decorator.js';
import { IPipelineStep } from '../../core/step.interface.js';
import { PipelineContext } from '../../core/context.js';

/**
 * Decorator concreto que intercepta a execução para coletar telemetria precisa de tempo.
 */
export class TimingDecorator<TIn, TOut = TIn> extends StepDecorator<TIn, TOut> {
  constructor(
    wrappedStep: IPipelineStep<TIn, TOut>,
    private readonly onMetricCollected?: (stepName: string, durationMs: number) => void
  ) {
    super(wrappedStep);
  }

  public override async execute(context: PipelineContext<TIn>): Promise<PipelineContext<TOut>> {
    const start = performance.now();
    try {
      const result = await this.wrappedStep.execute(context);
      const durationMs = performance.now() - start;
      
      // Salva no contexto de resultado em metadados
      const currentTimings = result.getMetadata<Record<string, number>>('timings') || {};
      currentTimings[this.name] = durationMs;
      result.setMetadata('timings', currentTimings);

      if (this.onMetricCollected) {
        this.onMetricCollected(this.name, durationMs);
      }
      return result;
    } catch (error) {
      const durationMs = performance.now() - start;
      const currentTimings = context.getMetadata<Record<string, number>>('timings') || {};
      currentTimings[this.name] = durationMs;
      context.setMetadata('timings', currentTimings);
      throw error;
    }
  }
}

/**
 * Decorator concreto que adiciona mecanismo de retentativas automáticas (Retry)
 * com backoff exponencial ou linear configurável sem poluir a lógica de negócio do step.
 */
export class RetryDecorator<TIn, TOut = TIn> extends StepDecorator<TIn, TOut> {
  constructor(
    wrappedStep: IPipelineStep<TIn, TOut>,
    private readonly maxRetries: number = 3,
    private readonly delayMs: number = 50,
    private readonly backoffMultiplier: number = 1.5
  ) {
    super(wrappedStep);
  }

  public override async execute(context: PipelineContext<TIn>): Promise<PipelineContext<TOut>> {
    let attempts = 0;
    let currentDelay = this.delayMs;
    let lastError: Error | undefined;

    while (attempts <= this.maxRetries) {
      try {
        return await this.wrappedStep.execute(context);
      } catch (error) {
        attempts++;
        lastError = error as Error;

        if (attempts > this.maxRetries) {
          break;
        }

        // Aguarda com backoff
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        currentDelay = Math.round(currentDelay * this.backoffMultiplier);
      }
    }

    throw new Error(
      `Falha na etapa '${this.name}' após ${this.maxRetries} tentativas. Causa original: ${lastError?.message}`
    );
  }
}
