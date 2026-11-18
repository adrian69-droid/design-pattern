import { Pipeline } from '../../core/pipeline.js';
import { IPipelineStep } from '../../core/step.interface.js';
import { PipelineContext } from '../../core/context.js';
import { StepFactory } from '../factory/step.factory.js';
import { CompositeStep } from '../composite/composite.step.js';
import { TimingDecorator, RetryDecorator } from '../decorator/decorators.js';
import { IErrorHandlingStrategy } from '../strategy/error-strategy.interface.js';
import { IPipelineObserver } from '../observer/observer.interface.js';

/**
 * PADRÃO DE PROJETO: Builder
 * 
 * Problema Resolvido:
 * Separa a construção complexa de um objeto Pipeline de sua representação final.
 * Fornece uma API fluente, intuitiva e expressiva para os desenvolvedores configurarem
 * etapas, decorators de resiliência/timing, sub-pipelines (Composite), tratamento de erros (Strategy)
 * e observadores (Observer) passo a passo, prevenindo a necessidade de construtores gigantes
 * ou instanciações manuais suscetíveis a erros de configuração.
 */
export class PipelineBuilder<TIn = any, TCurrent = TIn> {
  private pipelineName = 'CustomPipeline';
  private steps: IPipelineStep<any, any>[] = [];
  private errorStrategy?: IErrorHandlingStrategy<any>;
  private observers: IPipelineObserver<any>[] = [];

  public static create<T = any>(name?: string): PipelineBuilder<T, T> {
    const builder = new PipelineBuilder<T, T>();
    if (name) {
      builder.named(name);
    }
    return builder;
  }

  public named(name: string): this {
    this.pipelineName = name;
    return this;
  }

  public addStep<TNext>(step: IPipelineStep<TCurrent, TNext>): PipelineBuilder<TIn, TNext> {
    this.steps.push(step);
    return this as unknown as PipelineBuilder<TIn, TNext>;
  }

  public transform<TNext>(
    name: string,
    transformFn: (data: TCurrent, context: PipelineContext<TCurrent>) => Promise<TNext> | TNext
  ): PipelineBuilder<TIn, TNext> {
    const step = StepFactory.createTransform(name, transformFn);
    return this.addStep(step);
  }

  public filter(
    name: string,
    predicate: (data: TCurrent, context: PipelineContext<TCurrent>) => Promise<boolean> | boolean,
    abortOnFail: boolean = true,
    failReason?: string
  ): this {
    const step = StepFactory.createFilter(name, predicate, abortOnFail, failReason);
    this.steps.push(step);
    return this;
  }

  public validate(
    name: string,
    validatorFn: (data: TCurrent) => { valid: boolean; message?: string } | boolean
  ): this {
    const step = StepFactory.createValidator(name, validatorFn);
    this.steps.push(step);
    return this;
  }

  public tap(
    name: string,
    tapFn: (data: TCurrent, context: PipelineContext<TCurrent>) => Promise<void> | void
  ): this {
    const step = StepFactory.createTap(name, tapFn);
    this.steps.push(step);
    return this;
  }

  /**
   * Adiciona um sub-pipeline utilizando o padrão Composite.
   */
  public subPipeline(
    name: string,
    configure: (subBuilder: PipelineBuilder<TCurrent, TCurrent>) => void
  ): this {
    const subBuilder = new PipelineBuilder<TCurrent, TCurrent>();
    subBuilder.named(name);
    configure(subBuilder);
    const subPipeline = subBuilder.build();

    const compositeStep = new CompositeStep<TCurrent>(name, [...subPipeline.getSteps()]);
    this.steps.push(compositeStep);
    return this;
  }

  /**
   * Envelopa o último step adicionado com o TimingDecorator.
   */
  public withTimer(onMetricCollected?: (stepName: string, durationMs: number) => void): this {
    if (this.steps.length === 0) {
      throw new Error('Não há etapa anterior para decorar com medição de tempo.');
    }
    const lastIdx = this.steps.length - 1;
    this.steps[lastIdx] = new TimingDecorator(this.steps[lastIdx], onMetricCollected);
    return this;
  }

  /**
   * Envelopa o último step adicionado com o RetryDecorator.
   */
  public withRetry(maxRetries: number = 3, delayMs: number = 50, backoffMultiplier: number = 1.5): this {
    if (this.steps.length === 0) {
      throw new Error('Não há etapa anterior para decorar com mecanismo de repetição.');
    }
    const lastIdx = this.steps.length - 1;
    this.steps[lastIdx] = new RetryDecorator(this.steps[lastIdx], maxRetries, delayMs, backoffMultiplier);
    return this;
  }

  /**
   * Configura a estratégia de tratamento de erro (Strategy Pattern).
   */
  public withErrorStrategy(strategy: IErrorHandlingStrategy<any>): this {
    this.errorStrategy = strategy;
    return this;
  }

  /**
   * Registra um observador para eventos do ciclo de vida (Observer Pattern).
   */
  public subscribe(observer: IPipelineObserver<any>): this {
    this.observers.push(observer);
    return this;
  }

  /**
   * Constrói e retorna a instância pronta do Pipeline.
   */
  public build(): Pipeline<TIn, TCurrent> {
    const pipeline = new Pipeline<TIn, TCurrent>({
      name: this.pipelineName,
      errorStrategy: this.errorStrategy,
      observers: this.observers
    });

    for (const step of this.steps) {
      pipeline.addStep(step);
    }

    return pipeline;
  }
}
