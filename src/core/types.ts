/**
 * Tipos fundamentais e status do ciclo de vida da biblioteca PipelineForge.
 */

export type ExecutionStatus = 
  | 'idle'
  | 'running'
  | 'completed'
  | 'aborted'
  | 'failed'
  | 'compensated';

export interface StepExecutionRecord {
  stepName: string;
  durationMs: number;
  timestamp: Date;
  status: 'success' | 'failed' | 'skipped' | 'compensated';
  error?: Error;
}

export type PipelineEventName = 
  | 'pipeline:start'
  | 'pipeline:step:start'
  | 'pipeline:step:success'
  | 'pipeline:step:error'
  | 'pipeline:complete'
  | 'pipeline:abort';

export interface PipelineEventPayload<T = unknown> {
  eventName: PipelineEventName;
  stepName?: string;
  data?: T;
  error?: Error;
  timestamp: Date;
}
