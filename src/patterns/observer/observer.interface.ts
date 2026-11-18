import { PipelineEventPayload } from '../../core/types.js';

/**
 * PADRÃO DE PROJETO: Observer (Interface do Observador)
 * 
 * Problema Resolvido:
 * Define uma dependência de um-para-muitos entre objetos. Quando o pipeline sofre
 * alterações de estado ou atinge marcos em seu ciclo de vida (início, fim, falha, step),
 * todos os observadores registrados são notificados de forma desacoplada e assíncrona.
 */
export interface IPipelineObserver<T = unknown> {
  readonly observerName: string;

  /**
   * Método disparado quando um evento do ciclo de vida ocorre no pipeline.
   */
  onEvent(event: PipelineEventPayload<T>): Promise<void> | void;
}
