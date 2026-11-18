import { describe, it, expect, vi } from 'vitest';
import { IReversibleStep, TransactionalStep } from '../src/patterns/command/reversible.step.js';
import { PipelineContext } from '../src/core/context.js';

describe('Design Pattern: Command (IReversibleStep & TransactionalStep)', () => {
  it('deve executar todos os comandos reversíveis com sucesso', async () => {
    const step1: IReversibleStep<number> = {
      name: 'Comando1',
      execute: ctx => {
        ctx.setData(ctx.data + 10);
        return ctx;
      },
      compensate: vi.fn()
    };

    const step2: IReversibleStep<number> = {
      name: 'Comando2',
      execute: ctx => {
        ctx.setData(ctx.data * 2);
        return ctx;
      },
      compensate: vi.fn()
    };

    const tx = new TransactionalStep<number>('BlocoTransacional', [step1, step2]);
    const ctx = new PipelineContext<number>(5);

    const result = await tx.execute(ctx);

    // (5 + 10) * 2 = 30
    expect(result.data).toBe(30);
    expect(step1.compensate).not.toHaveBeenCalled();
    expect(step2.compensate).not.toHaveBeenCalled();
  });

  it('deve disparar rollback compensatório em ordem inversa (LIFO) quando um comando falhar', async () => {
    const compensationOrder: string[] = [];

    const step1: IReversibleStep<string[]> = {
      name: 'CriarArquivo',
      execute: ctx => {
        ctx.data.push('arquivo_criado');
        return ctx;
      },
      compensate: () => {
        compensationOrder.push('CriarArquivo_desfeito');
      }
    };

    const step2: IReversibleStep<string[]> = {
      name: 'DeduzirSaldo',
      execute: ctx => {
        ctx.data.push('saldo_deduzido');
        return ctx;
      },
      compensate: () => {
        compensationOrder.push('DeduzirSaldo_estornado');
      }
    };

    const step3: IReversibleStep<string[]> = {
      name: 'NotificarServicoExterno',
      execute: () => {
        throw new Error('Falha catastrófica no serviço terceiro');
      },
      compensate: () => {
        compensationOrder.push('Notificar_desfeito');
      }
    };

    const tx = new TransactionalStep<string[]>('TransacaoFinanceira', [step1, step2, step3]);
    const ctx = new PipelineContext<string[]>([]);

    await expect(tx.execute(ctx)).rejects.toThrow('Falha catastrófica no serviço terceiro');

    // Ordem inversa: DeduzirSaldo compensa antes de CriarArquivo
    expect(compensationOrder).toEqual([
      'DeduzirSaldo_estornado',
      'CriarArquivo_desfeito'
    ]);
    expect(ctx.status).toBe('compensated');
  });
});
