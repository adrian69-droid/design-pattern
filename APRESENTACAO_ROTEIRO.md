# 🎬 Roteiro de Apresentação em Vídeo (Máximo 10 Minutos)

Este documento foi elaborado para guiar a gravação do vídeo de apresentação e defesa arquitetural da biblioteca **PipelineForge** no YouTube, atendendo rigorosamente a todos os critérios de avaliação definidos pelo professor.

---

## ⏱️ Grade de Tempo do Vídeo (Total: 10 Minutos)

| Bloco | Duração | Responsável | Conteúdo / Foco na Tela |
| :--- | :--- | :--- | :--- |
| **1. Abertura & Visão Geral** | 01:00 min | Aluno 1 (ou todos) | Apresentação da equipe, tema escolhido, problema que a lib resolve. |
| **2. Demonstração Prática** | 01:30 min | Aluno 1 e 2 | Demonstração em código do caso Out-of-the-Box vs Extensão pelo Cliente (OCP). |
| **3. Defesa: Aluno 1** | 01:45 min | Aluno 1 | Defesa dos padrões **Builder** e **Composite**. |
| **4. Defesa: Aluno 2** | 01:45 min | Aluno 2 | Defesa dos padrões **Chain of Responsibility** e **Command**. |
| **5. Defesa: Aluno 3** | 01:45 min | Aluno 3 | Defesa dos padrões **Strategy** e **Decorator**. |
| **6. Defesa: Aluno 4** | 01:45 min | Aluno 4 | Defesa dos padrões **Observer** e **Factory Method**. |
| **7. Encerramento** | 00:30 min | Todos | Execução dos testes (`npm test`), considerações finais e agradecimentos. |

---

## 🎙️ Roteiro Detalhado por Aluno

### 🕒 Bloco 1: Visão Geral (00:00 - 01:00)
- **Quem fala:** Aluno 1 (ou o grupo conjuntamente)
- **O que mostrar:** Slide inicial com o nome da equipe e a tela do VS Code com a estrutura limpa de pastas da biblioteca em `src/`.
- **Fala sugerida:**
  > *"Olá a todos e professor! Somos a equipe composta por [Nome 1], [Nome 2], [Nome 3] e [Nome 4]. Hoje estamos apresentando a nossa biblioteca, a **PipelineForge**.*  
  > *Importante destacar: nosso artefato é **estritamente uma biblioteca de código**, desenvolvida em TypeScript e empacotada para consumo via npm, e não uma aplicação final ou API standalone.*  
  > *A PipelineForge foi criada para resolver o problema clássico de processamento de fluxos de dados em memória, permitindo que desenvolvedores criem sequências complexas de validação, transformação e filtragem com alta resiliência, telemetria desacoplada e suporte a rollback transacional."*

---

### 🕒 Bloco 2: Uso Prático (01:00 - 02:30)
- **Quem fala:** Aluno 1 e Aluno 2
- **O que mostrar:** Abrir o arquivo `examples/1-out-of-the-box.ts` e em seguida `examples/2-client-extension.ts`. Rodar no terminal `npm run demo:basic` e `npm run demo:extension`.
- **Fala sugerida:**
  > **Aluno 1:** *"Aqui no arquivo `examples/1-out-of-the-box.ts`, vemos como um desenvolvedor cliente consome a biblioteca de forma imediata. Ele instancia os observadores nativos de métricas e auditoria e usa o `PipelineBuilder` para encadear validações, filtros e sub-pipelines já fornecidos pela biblioteca. Observem os decorators nativos de medição de tempo e retry."*  
  > *(Executa `npm run demo:basic` e mostra a saída formatada no terminal).*  
  >
  > **Aluno 2:** *"Agora, no arquivo `examples/2-client-extension.ts`, demonstramos o requisito de **Extensibilidade** respeitando o **Open/Closed Principle**. Suponha que o cliente queira salvar o dado em um banco NoSQL e cobrar um gateway com estorno automático. Ele simplesmente cria as classes `DatabaseSaveStep` e `PaymentGatewayCommand` implementando nossas interfaces públicas `IPipelineStep` e `IReversibleStep`. O cliente estende o comportamento da lib sem alterar uma única linha do código-fonte original!"*  
  > *(Executa `npm run demo:extension` e mostra o estorno e persistência customizados).*

---

### 🕒 Bloco 3: Defesa Arquitetural - Aluno 1 (02:30 - 04:15)
- **Quem fala:** **Aluno 1**
- **Padrões defendidos:** **Builder** e **Composite**
- **O que mostrar:** Código de `src/patterns/builder/pipeline.builder.ts` e `src/patterns/composite/composite.step.ts`.
- **Roteiro de defesa:**
  1. **Builder:**
     - *Onde está:* Arquivo `src/patterns/builder/pipeline.builder.ts`.
     - *Problema resolvido:* A criação de um pipeline envolve registrar dezenas de passos, sub-pipelines, estratégias e observadores. Se usássemos o construtor padrão da classe `Pipeline`, teríamos o anti-pattern de *Telescoping Constructor* ou parâmetros confusos.
     - *Por que foi adequado:* O `PipelineBuilder` oferece uma API fluente onde cada método retorna a própria instância do builder, permitindo checagem estática de tipos entre as etapas e garantindo que o objeto final só seja instanciado em estado válido ao chamar `.build()`.
  2. **Composite:**
     - *Onde está:* Arquivo `src/patterns/composite/composite.step.ts`.
     - *Problema resolvido:* Em fluxos reais, frequentemente precisamos agrupar várias etapas em sub-rotinas modulares reutilizáveis. Sem o Composite, o motor do pipeline precisaria tratar steps simples e grupos de steps de formas distintas com condicionais `if/else`.
     - *Por que foi adequado:* O `CompositeStep` implementa a mesma interface `IPipelineStep` dos nós atômicos. Assim, o orquestrador executa o sub-pipeline chamando `execute()` de forma polimórfica e uniforme, viabilizando árvores hierárquicas de execução.

---

### 🕒 Bloco 4: Defesa Arquitetural - Aluno 2 (04:15 - 06:00)
- **Quem fala:** **Aluno 2**
- **Padrões defendidos:** **Chain of Responsibility** e **Command**
- **O que mostrar:** Código de `src/patterns/chain/execution.chain.ts` e `src/patterns/command/reversible.step.ts`.
- **Roteiro de defesa:**
  1. **Chain of Responsibility:**
     - *Onde está:* Arquivo `src/patterns/chain/execution.chain.ts`.
     - *Problema resolvido:* Acoplamento rígido entre a origem dos dados e os múltiplos nós responsáveis por processá-los. Precisávamos de uma forma limpa de passar a requisição entre os elos e conceder a qualquer manipulador o poder de interromper o fluxo sem estourar exceções desnecessárias.
     - *Por que foi adequado:* Cada `StepChainHandler` processa o payload e, se `context.isAborted()` for acionado, interrompe a propagação imediatamente sem acionar os elos seguintes, mantendo o controle descentralizado e flexível.
  2. **Command:**
     - *Onde está:* Arquivo `src/patterns/command/reversible.step.ts`.
     - *Problema resolvido:* Em pipelines que realizam ações com efeitos colaterais externos (débitos financeiros, gravação de arquivos), se o passo 3 falhar, os passos 1 e 2 deixariam o sistema em estado inconsistente.
     - *Por que foi adequado:* Criamos a interface `IReversibleStep` estendendo o Command com o método `compensate()`. A classe `TransactionalStep` rastreia os comandos executados com sucesso e, na hipótese de qualquer falha posterior, executa a compensação em ordem inversa (LIFO / Saga Pattern), garantindo consistência eventual.

---

### 🕒 Bloco 5: Defesa Arquitetural - Aluno 3 (06:00 - 07:45)
- **Quem fala:** **Aluno 3**
- **Padrões defendidos:** **Strategy** e **Decorator**
- **O que mostrar:** Código de `src/patterns/strategy/` e `src/patterns/decorator/`.
- **Roteiro de defesa:**
  1. **Strategy:**
     - *Onde está:* Arquivo `src/patterns/strategy/error-strategy.interface.ts` e `strategies.ts`.
     - *Problema resolvido:* Diferentes aplicações clientes possuem políticas distintas de tolerância a falhas: alguns sistemas exigem falha imediata (*Fail-Fast*), enquanto pipelines de telemetria preferem ignorar o erro (*IgnoreAndContinue*) ou substituir o dado por um valor padrão (*FallbackValue*).
     - *Por que foi adequado:* Encapsulamos a política de erro na interface `IErrorHandlingStrategy`. A biblioteca fornece 3 estratégias prontas e permite que o cliente defina sua própria estratégia em tempo de execução sem mexer na lógica do pipeline.
  2. **Decorator:**
     - *Onde está:* Arquivo `src/patterns/decorator/step.decorator.ts` e `decorators.ts`.
     - *Problema resolvido:* Adicionar comportamentos ortogonais de infraestrutura — como contagem precisa de milissegundos (`TimingDecorator`) ou repetição com backoff exponencial (`RetryDecorator`) — sem poluir a regra de negócio do step e sem criar hierarquias de herança rígidas.
     - *Por que foi adequado:* O decorator implementa `IPipelineStep` e recebe outro step por composição. Ele adiciona o comportamento antes e depois de chamar o `wrappedStep.execute()`, respeitando integralmente o Open/Closed Principle.

---

### 🕒 Bloco 6: Defesa Arquitetural - Aluno 4 (07:45 - 09:30)
- **Quem fala:** **Aluno 4**
- **Padrões defendidos:** **Observer** e **Factory Method**
- **O que mostrar:** Código de `src/patterns/observer/` e `src/patterns/factory/step.factory.ts`.
- **Roteiro de defesa:**
  1. **Observer:**
     - *Onde está:* Arquivo `src/patterns/observer/event.emitter.ts` e `observers.ts`.
     - *Problema resolvido:* Como notificar componentes externos sobre o ciclo de vida do pipeline (`pipeline:start`, `step:success`, `step:error`, `complete`) sem acoplar nossa biblioteca a frameworks de log ou sistemas específicos de monitoramento.
     - *Por que foi adequado:* Estabelece uma relação um-para-muitos desacoplada. O `PipelineEventEmitter` emite eventos para qualquer `IPipelineObserver`. Disponibilizamos nativamente o `MetricsObserver` para estatísticas e o `AuditLogObserver` para compliance.
  2. **Factory Method:**
     - *Onde está:* Arquivo `src/patterns/factory/step.factory.ts`.
     - *Problema resolvido:* Facilitar o consumo dos nós mais frequentes (`TransformStep`, `FilterStep`, `ValidationStep`, `TapStep`) sem obrigar o cliente a instanciar classes concretas diretamente ou lidar manualmente com a propagação de metadados e histórico.
     - *Por que foi adequado:* A classe `StepFactory` centraliza a instanciação através de métodos como `createTransform` e `createFilter`, ocultando as classes concretas sob o contrato `IPipelineStep` e garantindo padronização na construção das etapas.

---

### 🕒 Bloco 7: Encerramento e Validação dos Testes (09:30 - 10:00)
- **Quem fala:** Todos
- **O que mostrar:** Abrir o terminal no VS Code e rodar o comando:
  ```bash
  npm test
  ```
- **Fala sugerida:**
  > *"Para comprovar a robustez e integridade da arquitetura, executamos nossa suíte com 24 testes unitários e de integração desenvolvidos no Vitest, cobrindo todos os 8 padrões GoF implementados, além dos testes práticos out-of-the-box e de extensão pelo cliente.*  
  > *Todos os testes passam com 100% de sucesso e o build com `npm run build` gera a distribuição tipada pronta para publicação. Agradecemos a atenção de todos!"*

---

## 💡 Dicas Essenciais para a Gravação
1. **Vídeo no YouTube:** Pode ser gravado no Google Meet, Zoom ou OBS Studio e postado no YouTube como **Não Listado** (*Unlisted*).
2. **Tempo rigoroso:** Mantenha um cronômetro na tela ou no celular para não ultrapassar os **10 minutos**.
3. **Link no README:** Lembre-se de colar a URL do vídeo gravado no campo correspondente no `README.md`.
