import { describe, it, expect } from 'vitest';
import {
  PipelineBuilder,
  MetricsObserver,
  AuditLogObserver,
  IgnoreAndContinueStrategy
} from '../src/index.js';

/**
 * CASO DE USO 1: OUT-OF-THE-BOX
 * 
 * Demonstra como um desenvolvedor cliente instala a lib (@pipeline-forge),
 * importa seus componentes prontos e executa um fluxo de enriquecimento e validação
 * de dados com telemetria, retentativas e observadores sem escrever código de infraestrutura.
 */
describe('Demonstração Out-Of-The-Box: Processamento de Pedidos E-commerce', () => {
  interface RawOrder {
    orderId: string;
    customerEmail: string;
    items: Array<{ name: string; price: number; quantity: number }>;
    couponCode?: string;
  }

  interface ProcessedOrder {
    orderId: string;
    customerEmail: string;
    totalAmount: number;
    discountApplied: number;
    finalAmount: number;
    status: 'approved' | 'rejected';
  }

  it('deve processar pedido utilizando recursos nativos da biblioteca', async () => {
    // 1. Instanciação de observadores prontos da biblioteca
    const metricsObserver = new MetricsObserver<any>();
    const auditObserver = new AuditLogObserver<any>(log => console.log(log));

    // 2. Construção fluente do pipeline com Builder, Factory, Decorators e Composite
    const orderPipeline = PipelineBuilder.create<RawOrder>('OrderProcessingPipeline')
      .subscribe(metricsObserver)
      .subscribe(auditObserver)

      // Validação nativa com StepFactory
      .validate('ValidarEmailEItens', order => {
        return order.customerEmail.includes('@') && order.items.length > 0;
      })

      // Sub-pipeline utilizando Composite nativo para cálculos financeiros
      .subPipeline('CalculosFinanceiros', sub => {
        sub.transform('CalcularSubtotal', order => {
          const totalAmount = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          return { ...order, totalAmount };
        });
      })

      // Transformação final para o modelo ProcessedOrder
      .transform<ProcessedOrder>('AplicarDescontoEStatus', (orderWithTotal: any) => {
        const discount = orderWithTotal.couponCode === 'DESCONTO10' ? orderWithTotal.totalAmount * 0.1 : 0;
        return {
          orderId: orderWithTotal.orderId,
          customerEmail: orderWithTotal.customerEmail,
          totalAmount: orderWithTotal.totalAmount,
          discountApplied: discount,
          finalAmount: orderWithTotal.totalAmount - discount,
          status: 'approved'
        };
      })
      // Decorator nativo para medir tempo e Decorator de retry
      .withTimer()
      .withRetry(2, 20)

      .build();

    // 3. Execução pelo desenvolvedor cliente
    const rawOrder: RawOrder = {
      orderId: 'ORD-2026-99',
      customerEmail: 'cliente@exemplo.com',
      couponCode: 'DESCONTO10',
      items: [
        { name: 'Teclado Mecânico', price: 350.0, quantity: 1 },
        { name: 'Mouse Gamer', price: 150.0, quantity: 2 }
      ]
    };

    const result = await orderPipeline.execute(rawOrder);

    // Validações
    expect(result.status).toBe('completed');
    expect(result.data.totalAmount).toBe(650.0);
    expect(result.data.discountApplied).toBe(65.0);
    expect(result.data.finalAmount).toBe(585.0);
    expect(result.data.status).toBe('approved');

    // Validação dos observadores out-of-the-box
    const metrics = metricsObserver.getMetrics();
    expect(metrics.totalRuns).toBe(1);
    expect(metrics.totalSuccessSteps).toBeGreaterThanOrEqual(3);
  });
});
