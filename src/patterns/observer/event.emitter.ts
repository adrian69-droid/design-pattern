import { IPipelineObserver } from './observer.interface.js';
import { PipelineEventPayload, PipelineEventName } from '../../core/types.js';

/**
 * PADRÃO DE PROJETO: Observer (Subject / Notifier)
 * 
 * Gerencia o registro, cancelamento e emissão de eventos aos observadores inscritos.
 */
export class PipelineEventEmitter<T = unknown> {
  private readonly observers: Set<IPipelineObserver<T>> = new Set();

  public subscribe(observer: IPipelineObserver<T>): () => void {
    this.observers.add(observer);
    // Retorna função de unsubscribe (padrão ergonômico moderno)
    return () => {
      this.observers.delete(observer);
    };
  }

  public unsubscribe(observer: IPipelineObserver<T>): boolean {
    return this.observers.delete(observer);
  }

  public async emit(
    eventName: PipelineEventName,
    payload: { stepName?: string; data?: T; error?: Error } = {}
  ): Promise<void> {
    const fullPayload: PipelineEventPayload<T> = {
      eventName,
      stepName: payload.stepName,
      data: payload.data,
      error: payload.error,
      timestamp: new Date()
    };

    // Notifica todos os observadores de forma resiliente
    for (const observer of this.observers) {
      try {
        await observer.onEvent(fullPayload);
      } catch (err) {
        console.error(`Erro no observador '${observer.observerName}':`, err);
      }
    }
  }

  public clearObservers(): void {
    this.observers.clear();
  }

  public get observerCount(): number {
    return this.observers.size;
  }
}
