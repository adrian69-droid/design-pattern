import { IErrorHandlingStrategy } from './error-strategy.interface.js';
import { PipelineContext } from '../../core/context.js';

export interface PipelineErrorMetadata {
  step: string;
  error: string;
  action?: string;
}

/**
 * Strategy Concreta: Interrompe a execução imediatamente e relança o erro (Fail-Fast).
 * Ideal para pipelines de dados sensíveis onde inconsistências não são toleradas.
 */
export class FailFastStrategy<T> implements IErrorHandlingStrategy<T> {
  public readonly name = 'FailFastStrategy';

  public handleError(error: Error, stepName: string, context: PipelineContext<T>): never {
    context.setStatus('failed');
    throw new Error(`[Pipeline FailFast] Erro na etapa '${stepName}': ${error.message}`);
  }
}

/**
 * Strategy Concreta: Ignora o erro e continua o fluxo, salvando o erro nos metadados.
 * Ideal para telemetria ou processamento batch onde perdas parciais são aceitáveis.
 */
export class IgnoreAndContinueStrategy<T> implements IErrorHandlingStrategy<T> {
  public readonly name = 'IgnoreAndContinueStrategy';

  public handleError(error: Error, stepName: string, context: PipelineContext<T>): PipelineContext<T> {
    const existingErrors = context.getMetadata<Array<PipelineErrorMetadata>>('pipeline_errors') || [];
    existingErrors.push({ step: stepName, error: error.message });
    context.setMetadata('pipeline_errors', existingErrors);
    return context;
  }
}

/**
 * Strategy Concreta: Substitui o dado problemático por um valor padrão seguro (Fallback).
 */
export class FallbackValueStrategy<T> implements IErrorHandlingStrategy<T> {
  public readonly name = 'FallbackValueStrategy';

  constructor(private readonly fallbackValue: T) {}

  public handleError(error: Error, stepName: string, context: PipelineContext<T>): PipelineContext<T> {
    const existingErrors = context.getMetadata<Array<PipelineErrorMetadata>>('pipeline_errors') || [];
    existingErrors.push({ step: stepName, error: error.message, action: 'fallback_applied' });
    context.setMetadata('pipeline_errors', existingErrors);
    context.setData(this.fallbackValue);
    return context;
  }
}
