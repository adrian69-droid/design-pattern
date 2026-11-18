import { IPipelineStep } from '../../core/step.interface.js';
import { PipelineContext } from '../../core/context.js';

/**
 * Step concreto para transformação de dados.
 */
export class TransformStep<TIn, TOut> implements IPipelineStep<TIn, TOut> {
  constructor(
    public readonly name: string,
    private readonly transformFn: (data: TIn, context: PipelineContext<TIn>) => Promise<TOut> | TOut
  ) {}

  public async execute(context: PipelineContext<TIn>): Promise<PipelineContext<TOut>> {
    const transformedData = await this.transformFn(context.data, context);
    // Cria novo contexto mantendo histórico e metadados
    const outContext = new PipelineContext<TOut>(transformedData);
    outContext.setStatus(context.status);
    
    // Propaga histórico e todos os metadados
    context.getHistory().forEach(h => outContext.addHistoryRecord(h));
    outContext.copyMetadataFrom(context);

    return outContext;
  }
}

/**
 * Step concreto para filtragem/descarte condicional.
 */
export class FilterStep<T> implements IPipelineStep<T, T> {
  constructor(
    public readonly name: string,
    private readonly predicate: (data: T, context: PipelineContext<T>) => Promise<boolean> | boolean,
    private readonly abortOnFail: boolean = true,
    private readonly failReason: string = 'Elemento filtrado pelo FilterStep'
  ) {}

  public async execute(context: PipelineContext<T>): Promise<PipelineContext<T>> {
    const passes = await this.predicate(context.data, context);
    if (!passes && this.abortOnFail) {
      context.abort(this.failReason);
    }
    return context;
  }
}

/**
 * Step concreto para validação de dados com lançamento de erro se inválido.
 */
export class ValidationStep<T> implements IPipelineStep<T, T> {
  constructor(
    public readonly name: string,
    private readonly validatorFn: (data: T) => { valid: boolean; message?: string } | boolean
  ) {}

  public async execute(context: PipelineContext<T>): Promise<PipelineContext<T>> {
    const result = this.validatorFn(context.data);
    if (typeof result === 'boolean') {
      if (!result) {
        throw new Error(`Validação falhou na etapa '${this.name}'`);
      }
    } else if (!result.valid) {
      throw new Error(`Validação falhou na etapa '${this.name}': ${result.message || 'Dado inválido'}`);
    }
    return context;
  }
}

/**
 * Step concreto para efeitos colaterais (inspeção, telemetria inline, notificações)
 * sem mutação do dado principal.
 */
export class TapStep<T> implements IPipelineStep<T, T> {
  constructor(
    public readonly name: string,
    private readonly tapFn: (data: T, context: PipelineContext<T>) => Promise<void> | void
  ) {}

  public async execute(context: PipelineContext<T>): Promise<PipelineContext<T>> {
    await this.tapFn(context.data, context);
    return context;
  }
}

/**
 * PADRÃO DE PROJETO: Factory Method
 * 
 * Problema Resolvido:
 * Encapsula a criação e instanciação das etapas de processamento concretas e mais
 * comuns out-of-the-box. O cliente não precisa instanciar diretamente as classes internas,
 * permitindo que a fábrica forneça configurações padrão adequadas e desacople o cliente.
 */
export class StepFactory {
  public static createTransform<TIn, TOut>(
    name: string,
    transformFn: (data: TIn, context: PipelineContext<TIn>) => Promise<TOut> | TOut
  ): IPipelineStep<TIn, TOut> {
    return new TransformStep(name, transformFn);
  }

  public static createFilter<T>(
    name: string,
    predicate: (data: T, context: PipelineContext<T>) => Promise<boolean> | boolean,
    abortOnFail: boolean = true,
    failReason?: string
  ): IPipelineStep<T, T> {
    return new FilterStep(name, predicate, abortOnFail, failReason);
  }

  public static createValidator<T>(
    name: string,
    validatorFn: (data: T) => { valid: boolean; message?: string } | boolean
  ): IPipelineStep<T, T> {
    return new ValidationStep(name, validatorFn);
  }

  public static createTap<T>(
    name: string,
    tapFn: (data: T, context: PipelineContext<T>) => Promise<void> | void
  ): IPipelineStep<T, T> {
    return new TapStep(name, tapFn);
  }
}
