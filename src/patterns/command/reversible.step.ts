import { IPipelineStep } from '../../core/step.interface.js';
import { PipelineContext } from '../../core/context.js';

/**
 * PADRÃO DE PROJETO: Command
 * 
 * Problema Resolvido:
 * Encapsula uma requisição ou operação como um objeto autônomo com parâmetros,
 * lógica de execução e capacidade de desfaça (undo / compensate). Isso permite
 * enfileirar operações, rastrear histórico de execução e fornecer suporte
 * a rollback transacional quando uma etapa crítica do pipeline falha.
 */
export interface IReversibleStep<T> extends IPipelineStep<T, T> {
  /**
   * Operação de compensação executada se uma etapa posterior falhar,
   * revertendo o efeito colateral produzido por esta etapa.
   */
  compensate(context: PipelineContext<T>): Promise<void> | void;
}

/**
 * Step Composto Transacional (Command Invoker com Rollback / Saga)
 * Executa uma sequência de comandos reversíveis. Se qualquer etapa lançar exceção,
 * ele aciona automaticamente as ações de compensação de todas as etapas que já haviam
 * sido executadas com sucesso, em ordem estritamente inversa.
 */
export class TransactionalStep<T> implements IPipelineStep<T, T> {
  private readonly steps: IReversibleStep<T>[] = [];

  constructor(
    public readonly name: string,
    steps: IReversibleStep<T>[] = []
  ) {
    this.steps.push(...steps);
  }

  public addStep(step: IReversibleStep<T>): this {
    this.steps.push(step);
    return this;
  }

  public async execute(context: PipelineContext<T>): Promise<PipelineContext<T>> {
    const executedSteps: IReversibleStep<T>[] = [];
    let currentContext = context;

    try {
      for (const step of this.steps) {
        currentContext = await step.execute(currentContext);
        executedSteps.push(step);
      }
      return currentContext;
    } catch (error) {
      // Falha detectada: aciona compensação em ordem inversa (LIFO)
      currentContext.setStatus('failed');
      
      for (let i = executedSteps.length - 1; i >= 0; i--) {
        const stepToCompensate = executedSteps[i];
        try {
          await stepToCompensate.compensate(currentContext);
          currentContext.addHistoryRecord({
            stepName: `${stepToCompensate.name} (Compensação)`,
            durationMs: 0,
            timestamp: new Date(),
            status: 'compensated'
          });
        } catch (compensationError) {
          // Registra falha de compensação sem mascarar o erro original
          console.error(`Erro ao compensar etapa '${stepToCompensate.name}':`, compensationError);
        }
      }

      currentContext.setStatus('compensated');
      throw error;
    }
  }
}
