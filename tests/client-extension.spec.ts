import { describe, it, expect, vi } from 'vitest';
import {
  IPipelineStep,
  IReversibleStep,
  IErrorHandlingStrategy,
  IPipelineObserver,
  PipelineContext,
  PipelineEventPayload,
  PipelineBuilder,
  TransactionalStep
} from '../src/index.js';

/**
 * CASO DE USO 2: EXTENSÃO PELO CLIENTE (OPEN/CLOSED PRINCIPLE)
 * 
 * Demonstra como um desenvolvedor cliente estende a biblioteca criando suas próprias
 * classes e estratégias especializadas SEM ALTERAR NENHUMA LINHA do código original da lib.
 */

// 1. EXTENSÃO: O cliente cria um Step customizado de persistência
class CustomDatabaseSaveStep<T extends { id: string }> implements IPipelineStep<T, T> {
  public readonly name = 'CustomDatabaseSaveStep';

  constructor(private readonly dbMock: Map<string, T>) {}

  public async execute(context: PipelineContext<T>): Promise<PipelineContext<T>> {
    this.dbMock.set(context.data.id, context.data);
    context.setMetadata('saved_to_db_at', new Date().toISOString());
    return context;
  }
}

// 2. EXTENSÃO: O cliente cria um Step Reversível (Command) para cobrança via gateway externo
interface PaymentTransaction {
  id: string;
  amount: number;
  chargeId?: string;
  status: string;
}

class CustomStripeChargeStep implements IReversibleStep<PaymentTransaction> {
  public readonly name = 'CustomStripeChargeStep';
  public chargeRefunded = false;

  public async execute(context: PipelineContext<PaymentTransaction>): Promise<PipelineContext<PaymentTransaction>> {
    // Simula cobrança no Stripe
    context.data.chargeId = `ch_${Math.random().toString(36).substring(7)}`;
    context.data.status = 'captured';
    return context;
  }

  public async compensate(context: PipelineContext<PaymentTransaction>): Promise<void> {
    // Ação compensatória do Command em caso de falha posterior no fluxo
    this.chargeRefunded = true;
    context.data.status = 'refunded';
    context.setMetadata('refund_reason', 'Rollback transacional acionado');
  }
}

// 3. EXTENSÃO: O cliente cria uma Strategy customizada para notificar webhook/canal de alertas
class CustomWebhookAlertStrategy<T> implements IErrorHandlingStrategy<T> {
  public readonly name = 'CustomWebhookAlertStrategy';

  constructor(private readonly alertHook: (msg: string) => void) {}

  public handleError(error: Error, stepName: string, context: PipelineContext<T>): PipelineContext<T> {
    this.alertHook(`[ALERTA CRÍTICO NO PIPELINE] Falha no step ${stepName}: ${error.message}`);
    context.setStatus('aborted');
    context.abort(`Abortado pela estratégia de alerta: ${error.message}`);
    return context;
  }
}

// 4. EXTENSÃO: O cliente cria um Observer customizado para monitoramento estilo Prometheus
class CustomPrometheusMetricsObserver<T> implements IPipelineObserver<T> {
  public readonly observerName = 'CustomPrometheusMetricsObserver';
  public counter = 0;

  public onEvent(event: PipelineEventPayload<T>): void {
    if (event.eventName === 'pipeline:complete') {
      this.counter++;
    }
  }
}

describe('Demonstração de Extensão pelo Desenvolvedor Cliente (Open/Closed Principle)', () => {
  it('deve plugar classes customizadas do cliente no pipeline perfeitamente', async () => {
    const fakeDb = new Map<string, any>();
    const customDbStep = new CustomDatabaseSaveStep(fakeDb);
    const prometheusObserver = new CustomPrometheusMetricsObserver();

    const pipeline = PipelineBuilder.create<{ id: string; name: string }>()
      .subscribe(prometheusObserver)
      .transform('ConverterNome', obj => ({ ...obj, name: obj.name.toUpperCase() }))
      // Adicionando o step customizado do cliente
      .addStep(customDbStep)
      .build();

    const result = await pipeline.execute({ id: 'USR-1', name: 'joao' });

    expect(result.data.name).toBe('JOAO');
    expect(fakeDb.get('USR-1')).toEqual({ id: 'USR-1', name: 'JOAO' });
    expect(result.getMetadata('saved_to_db_at')).toBeDefined();
    expect(prometheusObserver.counter).toBe(1);
  });

  it('deve executar rollback de step reversível customizado do cliente', async () => {
    const stripeStep = new CustomStripeChargeStep();

    const failStep: IReversibleStep<PaymentTransaction> = {
      name: 'EmitirNotaFiscalFalha',
      execute: () => {
        throw new Error('SEFAZ fora do ar');
      },
      compensate: vi.fn()
    };

    const transactionalFlow = new TransactionalStep<PaymentTransaction>('CheckoutTransacional', [
      stripeStep,
      failStep
    ]);

    const ctx = new PipelineContext<PaymentTransaction>({
      id: 'TX-500',
      amount: 150.0,
      status: 'pending'
    });

    await expect(transactionalFlow.execute(ctx)).rejects.toThrow('SEFAZ fora do ar');

    // Verifica que o step customizado compensou e estornou
    expect(stripeStep.chargeRefunded).toBe(true);
    expect(ctx.data.status).toBe('refunded');
    expect(ctx.getMetadata('refund_reason')).toBe('Rollback transacional acionado');
  });

  it('deve utilizar a Strategy customizada do cliente', async () => {
    const alertMock = vi.fn();
    const customStrategy = new CustomWebhookAlertStrategy<number>(alertMock);

    const pipeline = PipelineBuilder.create<number>()
      .withErrorStrategy(customStrategy)
      .transform('OperacaoArriscada', () => {
        throw new Error('Divisão por zero simulada');
      })
      .build();

    const result = await pipeline.execute(100);

    expect(result.isAborted()).toBe(true);
    expect(alertMock).toHaveBeenCalledWith(
      expect.stringContaining('[ALERTA CRÍTICO NO PIPELINE] Falha no step OperacaoArriscada')
    );
  });
});
