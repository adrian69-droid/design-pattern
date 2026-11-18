import { describe, it, expect } from 'vitest';
import { PipelineBuilder } from '../src/patterns/builder/pipeline.builder.js';
import { StepFactory } from '../src/patterns/factory/step.factory.js';

describe('Design Pattern: Builder (PipelineBuilder)', () => {
  it('deve construir e executar um pipeline de forma fluente e tipada', async () => {
    interface RawUser {
      id: number;
      name: string;
      email: string;
      age: number;
    }

    interface SanitizedUser {
      id: number;
      name: string;
      email: string;
      isAdult: boolean;
    }

    const pipeline = PipelineBuilder.create<RawUser>('UserSanitizationPipeline')
      .validate('ValidarIdade', user => user.age > 0)
      .filter('FiltrarEmailValido', user => user.email.includes('@'))
      .transform<SanitizedUser>('SanitizarCampos', user => ({
        id: user.id,
        name: user.name.trim().toUpperCase(),
        email: user.email.toLowerCase().trim(),
        isAdult: user.age >= 18
      }))
      .build();

    const input: RawUser = {
      id: 101,
      name: '  Lucas Silva  ',
      email: 'LUCAS@EXAMPLE.COM ',
      age: 25
    };

    const result = await pipeline.execute(input);

    expect(result.status).toBe('completed');
    expect(result.data).toEqual({
      id: 101,
      name: 'LUCAS SILVA',
      email: 'lucas@example.com',
      isAdult: true
    });
    expect(result.getHistory().length).toBe(3);
  });
});
