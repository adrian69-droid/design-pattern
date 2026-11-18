import { describe, it, expect } from 'vitest';
import { Pipeline } from '../src/core/pipeline.js';
import { StepFactory } from '../src/patterns/factory/step.factory.js';
import {
  FailFastStrategy,
  IgnoreAndContinueStrategy,
  FallbackValueStrategy
} from '../src/patterns/strategy/strategies.js';

describe('Design Pattern: Strategy (IErrorHandlingStrategy)', () => {
  it('deve interromper o pipeline com FailFastStrategy', async () => {
    const pipeline = new Pipeline<number>({
      errorStrategy: new FailFastStrategy()
    });

    pipeline.addStep(StepFactory.createTransform('PassoFalho', () => {
      throw new Error('Falha simulada');
    }));

    await expect(pipeline.execute(10)).rejects.toThrow(/\[Pipeline FailFast\] Erro na etapa 'PassoFalho'/);
  });

  it('deve continuar a execução registrando o erro com IgnoreAndContinueStrategy', async () => {
    const pipeline = new Pipeline<number>({
      errorStrategy: new IgnoreAndContinueStrategy()
    });

    pipeline
      .addStep(StepFactory.createTransform('Passo1_Erro', () => {
        throw new Error('Erro tolerável');
      }))
      .addStep(StepFactory.createTransform('Passo2_Sucesso', n => n + 50));

    const result = await pipeline.execute(10);

    expect(result.data).toBe(60);
    const errors = result.getMetadata<Array<{ step: string; error: string }>>('pipeline_errors');
    expect(errors).toHaveLength(1);
    expect(errors?.[0].step).toBe('Passo1_Erro');
  });

  it('deve aplicar valor de contingência com FallbackValueStrategy', async () => {
    const pipeline = new Pipeline<string>({
      errorStrategy: new FallbackValueStrategy('VALOR_DE_CONTINGENCIA')
    });

    pipeline.addStep(StepFactory.createTransform('StepComErro', () => {
      throw new Error('Falha no parser');
    }));

    const result = await pipeline.execute('DADO_CORROMPIDO');
    expect(result.data).toBe('VALOR_DE_CONTINGENCIA');
  });
});
