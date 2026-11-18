import { IPipelineStep } from '../../core/step.interface.js';
import { PipelineContext } from '../../core/context.js';

/**
 * Interface do manipulador da cadeia (Handler)
 */
export interface IStepHandler<T> {
  setNext(handler: IStepHandler<T>): IStepHandler<T>;
  handle(context: PipelineContext<T>): Promise<PipelineContext<T>>;
}

/**
 * PADRÃO DE PROJETO: Chain of Responsibility
 * 
 * Problema Resolvido:
 * Evita o acoplamento do remetente de uma solicitação aos seus receptores ao permitir
 * que mais de um objeto trate a solicitação. Encapsula o fluxo sequencial onde cada
 * manipulador processa o dado e decide se repassa o controle para o próximo manipulador (next)
 * ou interrompe a cadeia caso o contexto tenha sido abortado (context.abort()).
 */
export class StepChainHandler<T> implements IStepHandler<T> {
  private nextHandler?: IStepHandler<T>;

  constructor(public readonly step: IPipelineStep<any, any>) {}

  public setNext(handler: IStepHandler<T>): IStepHandler<T> {
    this.nextHandler = handler;
    return handler;
  }

  public async handle(context: PipelineContext<T>): Promise<PipelineContext<T>> {
    // Se o contexto foi abortado em um nó anterior, a cadeia cessa imediatamente a propagação
    if (context.isAborted()) {
      return context;
    }

    const start = performance.now();
    try {
      const resultContext = await this.step.execute(context);
      
      resultContext.addHistoryRecord({
        stepName: this.step.name,
        durationMs: performance.now() - start,
        timestamp: new Date(),
        status: 'success'
      });

      // Se após executar este step o contexto foi abortado, não prossegue para o próximo elo
      if (resultContext.isAborted() || !this.nextHandler) {
        return resultContext;
      }

      return await this.nextHandler.handle(resultContext);
    } catch (error) {
      context.addHistoryRecord({
        stepName: this.step.name,
        durationMs: performance.now() - start,
        timestamp: new Date(),
        status: 'failed',
        error: error as Error
      });
      throw error;
    }
  }
}

/**
 * Construtor/Orquestrador da Cadeia de Responsabilidade
 */
export class ExecutionChain<T> {
  private head?: IStepHandler<T>;
  private tail?: IStepHandler<T>;

  public addStep(step: IPipelineStep<any, any>): this {
    const handler = new StepChainHandler<T>(step);
    if (!this.head) {
      this.head = handler;
      this.tail = handler;
    } else if (this.tail) {
      this.tail.setNext(handler);
      this.tail = handler;
    }
    return this;
  }

  public async execute(context: PipelineContext<T>): Promise<PipelineContext<T>> {
    if (!this.head) {
      return context;
    }
    return await this.head.handle(context);
  }
}
