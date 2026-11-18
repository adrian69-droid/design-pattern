import { describe, it, expect, vi } from 'vitest';
import { StepFactory } from '../src/patterns/factory/step.factory.js';
import { TimingDecorator, RetryDecorator } from '../src/patterns/decorator/decorators.js';
import { PipelineContext } from '../src/core/context.js';
import { PipelineBuilder } from '../src/patterns/builder/pipeline.builder.js';

describe('Design Pattern: Decorator (TimingDecorator & RetryDecorator)', () => {
  it('deve medir o tempo de execução sem alterar o resultado do step original', async () => {
    const rawStep = StepFactory.createTransform<number, number>('CalculoLento', async n => {
      await new Promise(r => setTimeout(r, 20));
      return n * 10;
    });

    const metricCallback = vi.fn();
    const decoratedStep = new TimingDecorator(rawStep, metricCallback);

    const ctx = new PipelineContext<number>(5);
    const result = await decoratedStep.execute(ctx);

    expect(result.data).toBe(50);
    expect(metricCallback).toHaveBeenCalledOnce();
    expect(metricCallback.mock.calls[0][0]).toBe('CalculoLento');
    expect(metricCallback.mock.calls[0][1]).toBeGreaterThanOrEqual(15);

    const timings = result.getMetadata<Record<string, number>>('timings');
    expect(timings?.['CalculoLento']).toBeDefined();
  });

  it('deve realizar retentativas em caso de falha transitória (RetryDecorator)', async () => {
    let attempts = 0;
    const unstableStep = StepFactory.createTransform<number, number>('OperacaoInstavel', n => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Falha de rede temporária');
      }
      return n + 100;
    });

    const retryStep = new RetryDecorator(unstableStep, 3, 10, 1.2);
    const ctx = new PipelineContext<number>(10);
    const result = await retryStep.execute(ctx);

    expect(attempts).toBe(3);
    expect(result.data).toBe(110);
  });

  it('deve falhar se o número de tentativas do RetryDecorator for excedido', async () => {
    const alwaysFails = StepFactory.createTransform<number, number>('SempreFalha', () => {
      throw new Error('Banco indisponível');
    });

    const retryStep = new RetryDecorator(alwaysFails, 2, 5, 1);
    const ctx = new PipelineContext<number>(1);

    await expect(retryStep.execute(ctx)).rejects.toThrow(/Falha na etapa 'SempreFalha' após 2 tentativas/);
  });

  it('deve aplicar decorators de forma fluente no PipelineBuilder', async () => {
    let callCount = 0;
    const pipeline = PipelineBuilder.create<{ value: number }>('ResilientPipeline')
      .transform('StepFlutuante', obj => {
        callCount++;
        if (callCount === 1) throw new Error('Glitch');
        return { value: obj.value * 2 };
      })
      .withRetry(2, 5)
      .withTimer()
      .build();

    const result = await pipeline.execute({ value: 15 });
    expect(result.data.value).toBe(30);
    expect(callCount).toBe(2);
  });
});
