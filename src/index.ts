/**
 * PipelineForge - Biblioteca Extensível de Processamento de Dados
 * 
 * Implementada com rigorosos padrões de projeto (GoF) e Clean Code:
 * 1. Builder: PipelineBuilder para configuração fluente
 * 2. Factory Method: StepFactory para instanciação de etapas out-of-the-box
 * 3. Composite: CompositeStep para suporte a pipelines hierárquicos e sub-fluxos
 * 4. Decorator: StepDecorator, TimingDecorator, RetryDecorator para composição transversal
 * 5. Chain of Responsibility: StepChainHandler / ExecutionChain para encadeamento e desacoplamento
 * 6. Command: IReversibleStep, TransactionalStep para operações com rollback/compensação
 * 7. Strategy: IErrorHandlingStrategy, FailFastStrategy, IgnoreAndContinueStrategy, FallbackValueStrategy
 * 8. Observer: IPipelineObserver, PipelineEventEmitter, MetricsObserver, AuditLogObserver
 */

// Core
export * from './core/types.js';
export * from './core/context.js';
export * from './core/step.interface.js';
export * from './core/pipeline.js';

// Patterns
export * from './patterns/builder/pipeline.builder.js';
export * from './patterns/factory/step.factory.js';
export * from './patterns/composite/composite.step.js';
export * from './patterns/decorator/step.decorator.js';
export * from './patterns/decorator/decorators.js';
export * from './patterns/chain/execution.chain.js';
export * from './patterns/command/reversible.step.js';
export * from './patterns/strategy/error-strategy.interface.js';
export * from './patterns/strategy/strategies.js';
export * from './patterns/observer/observer.interface.js';
export * from './patterns/observer/event.emitter.js';
export * from './patterns/observer/observers.js';
