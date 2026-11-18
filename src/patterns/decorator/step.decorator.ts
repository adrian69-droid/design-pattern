import { IPipelineStep } from '../../core/step.interface.js';
import { PipelineContext } from '../../core/context.js';

/**
 * PADRÃO DE PROJETO: Decorator (Classe Base)
 * 
 * Problema Resolvido:
 * Fornece a infraestrutura para anexar responsabilidades adicionais a um objeto
 * dinamicamente sem usar herança direta. As subclasses decoradoras envelopam
 * o step original mantendo a mesma interface IPipelineStep, respeitando plenamente
 * o Princípio Aberto/Fechado (OCP).
 */
export abstract class StepDecorator<TIn, TOut = TIn> implements IPipelineStep<TIn, TOut> {
  constructor(protected readonly wrappedStep: IPipelineStep<TIn, TOut>) {}

  public get name(): string {
    return this.wrappedStep.name;
  }

  public abstract execute(context: PipelineContext<TIn>): Promise<PipelineContext<TOut>>;
}
