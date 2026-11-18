import {
  PipelineBuilder,
  MetricsObserver,
  AuditLogObserver,
  StepFactory
} from '../src/index.js';

/**
 * EXEMPLO 1: USO OUT-OF-THE-BOX DA BIBLIOTECA
 * 
 * Cenário: Um desenvolvedor instala 'pipeline-forge' e cria um fluxo de ingestão
 * e saneamento de leads comerciais usando apenas recursos prontos da biblioteca.
 */

interface RawLead {
  name: string;
  email: string;
  score: number;
}

interface QualifiedLead {
  leadName: string;
  workEmail: string;
  qualificationTier: 'GOLD' | 'SILVER' | 'STANDARD';
  processedAt: string;
}

async function runOutOfTheBoxExample() {
  console.log('=== [DEMO OUT-OF-THE-BOX] INICIANDO PIPELINE ===\n');

  // 1. Instanciação dos Observers out-of-the-box
  const metrics = new MetricsObserver<any>();
  const audit = new AuditLogObserver<any>(log => console.log(log));

  // 2. Construção fluente do pipeline com o Builder
  const leadPipeline = PipelineBuilder.create<RawLead>('LeadQualificationPipeline')
    .subscribe(metrics)
    .subscribe(audit)

    // Validação básica com Factory
    .validate('ValidarDadosObrigatorios', lead => {
      return Boolean(lead.name && lead.email && lead.score >= 0);
    })

    // Filtro nativo: apenas leads com score >= 50 avançam
    .filter('FiltrarScoreMinimo', lead => lead.score >= 50, true, 'Lead com pontuação insuficiente')

    // Sub-pipeline (Composite) para enriquecimento
    .subPipeline('EnriquecimentoDeDados', sub => {
      sub.transform('NormalizarTexto', lead => ({
        ...lead,
        name: lead.name.trim().toUpperCase(),
        email: lead.email.trim().toLowerCase()
      }));
    })

    // Transformação final para a entidade de saída
    .transform<QualifiedLead>('ClassificarTier', (lead: any) => {
      let tier: 'GOLD' | 'SILVER' | 'STANDARD' = 'STANDARD';
      if (lead.score >= 90) tier = 'GOLD';
      else if (lead.score >= 70) tier = 'SILVER';

      return {
        leadName: lead.name,
        workEmail: lead.email,
        qualificationTier: tier,
        processedAt: new Date().toISOString()
      };
    })
    // Adicionando Decorators out-of-the-box: medição de tempo e retry
    .withTimer((stepName, duration) => {
      console.log(`⏱️ [Telemetria] Etapa '${stepName}' executada em ${duration.toFixed(2)}ms`);
    })
    .withRetry(2, 50)
    .build();

  // 3. Executando com dados válidos
  const inputLead: RawLead = {
    name: '  Ana Maria Silva ',
    email: 'ANA.SILVA@EMPRESA.COM  ',
    score: 95
  };

  console.log('Payload de entrada:', inputLead);
  const result = await leadPipeline.execute(inputLead);
  console.log('\nResultado do processamento:', result.data);
  console.log('Status do contexto:', result.status);
  console.log('\nMétricas consolidadas (Observer):', metrics.getMetrics());
}

runOutOfTheBoxExample().catch(console.error);
