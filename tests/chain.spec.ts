import { describe, it, expect } from 'vitest';
import { ExecutionChain } from '../src/patterns/chain/execution.chain.js';
import { StepFactory } from '../src/patterns/factory/step.factory.js';
import { PipelineContext } from '../src/core/context.js';

describe('Design Pattern: Chain of Responsibility (ExecutionChain)', () => {
  it('deve encadear a execução sequencialmente entre os elos da cadeia', async () => {
    const chain = new ExecutionChain<string>()
      .addStep(StepFactory.createTransform('Prefixo', s => `[PRE] ${s}`))
      .addStep(StepFactory.createTransform('Sufixo', s => `${s} [POS]`));

    const ctx = new PipelineContext<string>('DADO');
    const result = await chain.execute(ctx);

    expect(result.data).toBe('[PRE] DADO [POS]');
    expect(result.getHistory().length).toBe(2);
  });

  it('deve cessar a propagação imediatamente caso um elo aborte o contexto', async () => {
    let step3Executed = false;

    const chain = new ExecutionChain<number>()
      .addStep(StepFactory.createTransform('Passo1', n => n + 1))
      .addStep(StepFactory.createFilter('Passo2_Filtro', n => n > 10, true, 'Menor ou igual a 10'))
      .addStep(StepFactory.createTap('Passo3_NaoDeveRodar', () => {
        step3Executed = true;
      }));

    // Entrada: 5 -> Passo1 = 6 -> Passo2_Filtro (6 > 10 é falso) -> aborta!
    const ctx = new PipelineContext<number>(5);
    const result = await chain.execute(ctx);

    expect(result.isAborted()).toBe(true);
    expect(result.abortReason).toBe('Menor ou igual a 10');
    expect(step3Executed).toBe(false);
  });
});
