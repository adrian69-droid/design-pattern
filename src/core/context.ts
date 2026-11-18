import { ExecutionStatus, StepExecutionRecord } from './types.js';

/**
 * PipelineContext<T>
 * Encapsula o estado mutável do payload durante o fluxo de execução,
 * permitindo o compartilhamento seguro de metadados, controle de interrupção (abort)
 * e rastreabilidade da execução dos nós.
 */
export class PipelineContext<T> {
  private _data: T;
  private _status: ExecutionStatus = 'idle';
  private _abortReason?: string;
  private readonly _metadata: Map<string, unknown> = new Map();
  private readonly _history: StepExecutionRecord[] = [];

  constructor(initialData: T) {
    this._data = initialData;
  }

  public get data(): T {
    return this._data;
  }

  public setData(newData: T): void {
    this._data = newData;
  }

  public get status(): ExecutionStatus {
    return this._status;
  }

  public setStatus(status: ExecutionStatus): void {
    this._status = status;
  }

  public get abortReason(): string | undefined {
    return this._abortReason;
  }

  public isAborted(): boolean {
    return this._status === 'aborted';
  }

  /**
   * Interrompe imediatamente o avanço do pipeline.
   * Respeitado pela Chain of Responsibility para não acionar os próximos steps.
   */
  public abort(reason: string): void {
    this._status = 'aborted';
    this._abortReason = reason;
  }

  public setMetadata<M = unknown>(key: string, value: M): void {
    this._metadata.set(key, value);
  }

  public getMetadata<M = unknown>(key: string): M | undefined {
    return this._metadata.get(key) as M | undefined;
  }

  public hasMetadata(key: string): boolean {
    return this._metadata.has(key);
  }

  public getAllMetadata(): ReadonlyMap<string, unknown> {
    return this._metadata;
  }

  public copyMetadataFrom<TOther>(otherContext: PipelineContext<TOther>): void {
    otherContext.getAllMetadata().forEach((val, key) => {
      this.setMetadata(key, val);
    });
  }

  public addHistoryRecord(record: StepExecutionRecord): void {
    this._history.push(record);
  }

  public getHistory(): ReadonlyArray<StepExecutionRecord> {
    return [...this._history];
  }

  /**
   * Cria uma cópia clonada superficialmente para isolamento quando necessário.
   */
  public clone(): PipelineContext<T> {
    const cloned = new PipelineContext<T>(this._data);
    cloned._status = this._status;
    cloned._abortReason = this._abortReason;
    this._metadata.forEach((v, k) => cloned.setMetadata(k, v));
    this._history.forEach(h => cloned.addHistoryRecord({ ...h }));
    return cloned;
  }
}
