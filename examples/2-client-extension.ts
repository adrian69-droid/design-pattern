import {
  PipelineBuilder,
  IPipelineStep,
  IReversibleStep,
  IErrorHandlingStrategy,
  IPipelineObserver,
  PipelineContext,
  PipelineEventPayload,
  TransactionalStep
} from '../src/index.js';

/**
 * EXEMPLO 2: EXTENSÃO PELO CLIENTE (OPEN/CLOSED PRINCIPLE)
 * 
 * Cenário: O desenvolvedor cliente precisa de comportamentos que a biblioteca não possui
 * nativamente (ex: integração com banco NoSQL, chamada para gateway de pagamento com estorno
 * automático em caso de erro, e alerta via Slack/Discord).
 * 
 * Ele estende a biblioteca criando novas classes que implementam as interfaces públicas
 * SEM TOCAR EM NENHUM ARQUIVO DA BIBLIOTECA.
 */

interface OrderPayload {
  orderId: string;
  amount: number;
  customer: string;
}

// 1. O cliente cria um Step customizado
class DatabaseSaveStep implements IPipelineStep<OrderPayload, OrderPayload> {
  public readonly name = 'DatabaseSaveStep';

  public async execute(context: PipelineContext<OrderPayload>): Promise<PipelineContext<OrderPayload>> {
    console.log(`[Cliente DB] Salvando pedido ${context.data.orderId} no banco de dados customizado...`);
    context.setMetadata('db_persisted', true);
    return context;
  }
}

// 2. O cliente cria um Step Reversível (Command) com Rollback
class PaymentGatewayCommand implements IReversibleStep<OrderPayload> {
  public readonly name = 'PaymentGatewayCommand';

  public async execute(context: PipelineContext<OrderPayload>): Promise<PipelineContext<OrderPayload>> {
    console.log(`[Cliente Payment] Cobrando R$ ${context.data.amount} no gateway de pagamento...`);
    context.setMetadata('charge_id', 'ch_client_12345');
    return context;
  }

  public async compensate(context: PipelineContext<OrderPayload>): Promise<void> {
    console.log(`⚠️ [Cliente Rollback] Estornando cobrança ${context.getMetadata('charge_id')} devido a erro subsequente!`);
  }
}

// 3. O cliente cria uma Strategy customizada para envio de alertas
class DiscordNotificationStrategy<T> implements IErrorHandlingStrategy<T> {
  public readonly name = 'DiscordNotificationStrategy';

  public handleError(error: Error, stepName: string, context: PipelineContext<T>): PipelineContext<T> {
    console.error(`🚨 [Cliente Discord Alert] Notificando canal de suporte: Erro em '${stepName}': ${error.message}`);
    context.abort(`Abortado com notificação no Discord: ${error.message}`);
    return context;
  }
}

// 4. O cliente cria um Observer customizado para telemetria própria
class CustomTelemetryObserver<T> implements IPipelineObserver<T> {
  public readonly observerName = 'CustomTelemetryObserver';

  public onEvent(event: PipelineEventPayload<T>): void {
    if (event.eventName === 'pipeline:complete') {
      console.log(`📊 [Cliente Telemetria] Evento recebido: Pipeline finalizado com sucesso às ${event.timestamp.toISOString()}`);
    }
  }
}

async function runClientExtensionExample() {
  console.log('=== [DEMO EXTENSÃO DO CLIENTE] INICIANDO PIPELINE CUSTOMIZADO ===\n');

  const customObserver = new CustomTelemetryObserver<OrderPayload>();
  const customStrategy = new DiscordNotificationStrategy<OrderPayload>();

  const pipeline = PipelineBuilder.create<OrderPayload>('ECommerceExtendedPipeline')
    .subscribe(customObserver)
    .withErrorStrategy(customStrategy)

    // Usando steps customizados do cliente
    .addStep(new DatabaseSaveStep())

    // Usando step transacional com Command e compensação
    .addStep(new TransactionalStep<OrderPayload>('TransacaoFinanceira', [
      new PaymentGatewayCommand()
    ]))

    .transform('FinalizarPedido', order => {
      console.log(`[Cliente Finalizacao] Pedido ${order.orderId} aprovado e concluído.`);
      return order;
    })
    .build();

  const orderData: OrderPayload = {
    orderId: 'PEDIDO-9876',
    amount: 299.90,
    customer: 'Carlos Eduardo'
  };

  const result = await pipeline.execute(orderData);
  console.log('\nStatus final do pipeline customizado:', result.status);
  console.log('Metadados gravados pelo cliente:', result.getAllMetadata());
}

runClientExtensionExample().catch(console.error);
