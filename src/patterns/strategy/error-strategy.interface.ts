import { PipelineContext } from '../../core/context.js';

/**
 * PADRÃO DE PROJETO: Strategy (Interface)
 * 
 * Problema Resolvido:
 * Define uma família de algoritmos de tratamento e recuperação de erros, encapsula
 * cada um deles e os torna intercambiáveis em tempo de execução. A biblioteca ou o
 * cliente podem variar a política de tolerância a falhas sem acoplar o núcleo de execução
 * aos detalhes de cada política.
 */
export interface IErrorHandlingStrategy<T> {
  readonly name: string;

  /**
   * Trata um erro ocorrido durante a execução de um step do pipeline.
   * Pode relançar o erro, retornar um contexto alternativo ou registrar metadados.
   */
  handleError(
    error: Error,
    stepName: string,
    context: PipelineContext<T>
  ): Promise<PipelineContext<T>> | PipelineContext<T>;
}
