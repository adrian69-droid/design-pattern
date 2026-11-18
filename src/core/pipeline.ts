import { IPipelineStep } from './step.interface.js';
import { PipelineContext } from './context.js';
import { ExecutionChain } from '../patterns/chain/execution.chain.js';
import { IErrorHandlingStrategy } from '../patterns/strategy/error-strategy.interface.js';
import { FailFastStrategy } from '../patterns/strategy/strategies.js';
import { PipelineEventEmitter } from '../patterns/observer/event.emitter.js';
import { IPipelineObserver } from '../patterns/observer/observer.interface.js';

export interface PipelineOptions<T> {
  name?: string;
  errorStrategy?: IErrorHandlingStrategy<T>;
  observers?: IPipelineObserver<T>[];
}

/**
 * Classe central Pipeline<TIn, TOut>
 * Orquestra o ciclo de vida, a cadeia de execução (Chain of Responsibility),
 * tratamento de erros (Strategy) e eventos de ciclo de vida (Observer).
 */
export class Pipeline<TIn, TOut = TIn> {
  public readonly name: string;
  private readonly steps: IPipelineStep<any, any>[] = [];
  private errorStrategy: IErrorHandlingStrategy<any>;
  private readonly eventEmitter = new PipelineEventEmitter<any>();

  constructor(options: PipelineOptions<any> = {}) {
    this.name = options.name || 'DefaultPipeline';
    this.errorStrategy = options.errorStrategy || new FailFastStrategy();
    if (options.observers) {
      options.observers.forEach(obs => this.eventEmitter.subscribe(obs));
    }
  }

  public addStep(step: IPipelineStep<any, any>): this {
    this.steps.push(step);
    return this;
  }

  public setErrorStrategy(strategy: IErrorHandlingStrategy<any>): this {
    this.errorStrategy = strategy;
    return this;
  }

  public subscribe(observer: IPipelineObserver<any>): () => void {
    return this.eventEmitter.subscribe(observer);
  }

  public getSteps(): ReadonlyArray<IPipelineStep<any, any>> {
    return [...this.steps];
  }

  /**
   * Executa o pipeline completo passando pelo fluxo da Chain of Responsibility.
   */
  public async execute(initialData: TIn): Promise<PipelineContext<TOut>> {
    const context = new PipelineContext<any>(initialData);
    context.setStatus('running');

    await this.eventEmitter.emit('pipeline:start', { data: initialData });

    // Monta a Chain of Responsibility
    const chain = new ExecutionChain<any>();
    for (const step of this.steps) {
      chain.addStep({
        name: step.name,
        execute: async (ctx: PipelineContext<any>) => {
          await this.eventEmitter.emit('pipeline:step:start', { stepName: step.name, data: ctx.data });
          try {
            const outCtx = await step.execute(ctx);
            await this.eventEmitter.emit('pipeline:step:success', { stepName: step.name, data: outCtx.data });
            return outCtx;
          } catch (error) {
            await this.eventEmitter.emit('pipeline:step:error', {
              stepName: step.name,
              data: ctx.data,
              error: error as Error
            });
            // Delega para o Strategy
            return await this.errorStrategy.handleError(error as Error, step.name, ctx);
          }
        }
      });
    }

    try {
      const finalContext = await chain.execute(context);

      if (finalContext.isAborted()) {
        finalContext.setStatus('aborted');
        await this.eventEmitter.emit('pipeline:abort', { data: finalContext.data });
      } else if (finalContext.status !== 'failed') {
        finalContext.setStatus('completed');
        await this.eventEmitter.emit('pipeline:complete', { data: finalContext.data });
      }

      return finalContext as PipelineContext<TOut>;
    } catch (error) {
      context.setStatus('failed');
      throw error;
    }
  }
}
