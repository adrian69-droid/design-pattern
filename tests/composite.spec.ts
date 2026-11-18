import { describe, it, expect } from 'vitest';
import { CompositeStep } from '../src/patterns/composite/composite.step.js';
import { StepFactory } from '../src/patterns/factory/step.factory.js';
import { PipelineContext } from '../src/core/context.js';
import { PipelineBuilder } from '../src/patterns/builder/pipeline.builder.js';

describe('Design Pattern: Composite (CompositeStep)', () => {
  it('deve agrupar múltiplos passos e executá-los transparentemente como um único step', async () => {
    const subFlow = new CompositeStep<number>('SubProcessoMatematico')
      .addStep(StepFactory.createTransform('Somar10', n => n + 10))
      .addStep(StepFactory.createTransform('MultiplicarPor3', n => n * 3));

    const ctx = new PipelineContext<number>(5);
    const result = await subFlow.execute(ctx);

    // (5 + 10) * 3 = 45
    expect(result.data).toBe(45);
    expect(result.getHistory().length).toBe(2);
  });

  it('deve permitir composição hierárquica fluente com PipelineBuilder.subPipeline', async () => {
    const pipeline = PipelineBuilder.create<{ count: number }>('MainPipeline')
      .transform('IncrementarBase', obj => ({ count: obj.count + 1 }))
      .subPipeline('BlocoAninhado', sub => {
        sub.transform('Duplicar', obj => ({ count: obj.count * 2 }))
           .transform('Subtrair1', obj => ({ count: obj.count - 1 }));
      })
      .transform('Finalizar', obj => ({ count: obj.count + 100 }))
      .build();

    // Início: 2 -> +1 = 3 -> *2 = 6 -> -1 = 5 -> +100 = 105
    const result = await pipeline.execute({ count: 2 });
    expect(result.data.count).toBe(105);
  });
});
