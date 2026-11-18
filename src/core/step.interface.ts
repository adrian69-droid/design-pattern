import { PipelineContext } from './context.js';

/**
 * Interface base IPipelineStep
 * Define o contrato elementar que qualquer etapa do pipeline deve implementar.
 * Respeita o Princípio Aberto/Fechado (OCP), permitindo que desenvolvedores
 * criem etapas customizadas sem modificar o core da biblioteca.
 */
export interface IPipelineStep<TIn, TOut = TIn> {
  /**
   * Nome descritivo da etapa, útil para logs, auditoria e telemetria.
   */
  readonly name: string;

  /**
   * Executa o processamento sobre o contexto fornecido.
   * @param context Contexto contendo os dados de entrada
   * @returns O contexto contendo os dados resultantes
   */
  execute(context: PipelineContext<TIn>): Promise<PipelineContext<TOut>> | PipelineContext<TOut>;
}
