import { IPipelineStep } from '../../core/step.interface.js';
import { PipelineContext } from '../../core/context.js';

/**
 * PADRÃO DE PROJETO: Composite
 * 
 * Problema Resolvido:
 * Trata objetos individuais (steps simples) e composições de objetos (sub-pipelines ou blocos agrupados)
 * de maneira completamente uniforme. O orquestrador principal do pipeline ou qualquer cliente
 * pode invocar execute() em um CompositeStep exatamente como faria em um step atômico,
 * viabilizando árvores e sub-fluxos modulares reutilizáveis.
 */
export class CompositeStep<T> implements IPipelineStep<T, T> {
  private readonly children: IPipelineStep<any, any>[] = [];

  constructor(
    public readonly name: string,
    initialChildren: IPipelineStep<any, any>[] = []
  ) {
    this.children.push(...initialChildren);
  }

  /**
   * Adiciona um step filho à composição.
   */
  public addStep(step: IPipelineStep<any, any>): this {
    this.children.push(step);
    return this;
  }

  /**
   * Remove um step pelo nome.
   */
  public removeStep(name: string): boolean {
    const idx = this.children.findIndex(s => s.name === name);
    if (idx >= 0) {
      this.children.splice(idx, 1);
      return true;
    }
    return false;
  }

  /**
   * Retorna os steps filhos.
   */
  public getChildren(): ReadonlyArray<IPipelineStep<any, any>> {
    return [...this.children];
  }

  public async execute(context: PipelineContext<T>): Promise<PipelineContext<T>> {
    let currentContext: PipelineContext<any> = context;

    for (const child of this.children) {
      if (currentContext.isAborted()) {
        break;
      }

      const start = Date.now();
      try {
        currentContext = await child.execute(currentContext);
        currentContext.addHistoryRecord({
          stepName: `${this.name} > ${child.name}`,
          durationMs: Date.now() - start,
          timestamp: new Date(),
          status: 'success'
        });
      } catch (error) {
        currentContext.addHistoryRecord({
          stepName: `${this.name} > ${child.name}`,
          durationMs: Date.now() - start,
          timestamp: new Date(),
          status: 'failed',
          error: error as Error
        });
        throw error;
      }
    }

    return currentContext as PipelineContext<T>;
  }
}
