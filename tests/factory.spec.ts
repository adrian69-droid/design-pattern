import { describe, it, expect } from 'vitest';
import { StepFactory } from '../src/patterns/factory/step.factory.js';
import { PipelineContext } from '../src/core/context.js';

describe('Design Pattern: Factory Method (StepFactory)', () => {
  it('deve fabricar e executar TransformStep corretamente', async () => {
    const transformStep = StepFactory.createTransform<number, string>(
      'NumberToString',
      num => `Valor: ${num * 2}`
    );

    const ctx = new PipelineContext<number>(5);
    const result = await transformStep.execute(ctx);

    expect(result.data).toBe('Valor: 10');
  });

  it('deve fabricar e executar FilterStep abortando quando falso', async () => {
    const filterStep = StepFactory.createFilter<number>(
      'ApenasPares',
      num => num % 2 === 0,
      true,
      'Número não é par'
    );

    const ctx = new PipelineContext<number>(3);
    const result = await filterStep.execute(ctx);

    expect(result.isAborted()).toBe(true);
    expect(result.abortReason).toBe('Número não é par');
  });

  it('deve fabricar e executar ValidationStep lançando erro quando inválido', async () => {
    const validatorStep = StepFactory.createValidator<string>(
      'ValidarTamanhoMinimo',
      str => ({ valid: str.length >= 5, message: 'Menor que 5 caracteres' })
    );

    const invalidCtx = new PipelineContext<string>('abc');
    await expect(validatorStep.execute(invalidCtx)).rejects.toThrow('Menor que 5 caracteres');

    const validCtx = new PipelineContext<string>('abcdef');
    const validResult = await validatorStep.execute(validCtx);
    expect(validResult.data).toBe('abcdef');
  });

  it('deve fabricar e executar TapStep sem alterar o dado principal', async () => {
    let sideEffectValue = 0;
    const tapStep = StepFactory.createTap<number>('TapSideEffect', val => {
      sideEffectValue = val + 10;
    });

    const ctx = new PipelineContext<number>(42);
    const result = await tapStep.execute(ctx);

    expect(result.data).toBe(42);
    expect(sideEffectValue).toBe(52);
  });
});
