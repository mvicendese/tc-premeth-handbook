import {Model} from './model';
import {AsyncSubject, BehaviorSubject, defer, merge, Observable, Subject, throwError, Unsubscribable} from 'rxjs';
import {ResponsePage} from './pagination';
import {catchError, filter, map, mergeMap, sampleTime, scan, tap} from 'rxjs/operators';

export type ResolveFunction<T extends Model> = (batchIds: readonly string[]) => Observable<{[batchId: string]: T}>;

export interface ResolveQueueOptions {
  /**
   * The number of items to fetch in the current batch.
   * Must _not_ be larger than the default page size of the server.
   */
  readonly batchSize: number;

  /**
   * The time to wait before requesting a new batch.
   */
  readonly samplePeriod: number;
}

export class ModelResolveQueue<T extends Model> {
  static readonly DEFAULT_BATCH_SIZE = 20;
  static readonly DEFAULT_SAMPLE_PERIOD = 100 /* ms */;

  constructor(readonly resolve: ResolveFunction<T>) {}

  private queueIdsSubject = new BehaviorSubject<string[]>([]);
  private resolvedSubject = new Subject<[string, T]>();
  readonly pendingFetches = new Map<string, AsyncSubject<T>>();

  /**
   * An observable that emits each time a new value is resolved.
   * Only emits items after the observable is subscribed.
   *
   * To obtain a map of _all_ values resolved since the queue was started,
   * use [:allResolved:]
   */
  readonly resolved$: Observable<[string, T]> = defer(() => this.resolvedSubject.asObservable());

  /**
   * An observable which emits each time a new value is resolved
   * Each emission contains a map of all values resolved since the queue was created.
   */
  readonly allResolved$: Observable<{[id: string]: T}> = defer(() => {
    function resolveEntry([id, pendingValue]: [string, Observable<T>]): Observable<[string, T]> {
      return pendingValue.pipe(map(resolvedValue => [id, resolvedValue]));
    }
    const currentPending = [...this.pendingFetches.entries()].map(resolveEntry);

    return merge(
      merge(...currentPending),
      this.resolved$
    ).pipe(
      scan((acc, [id, value]) => ({...acc, [id]: value}), {} as {[k: string]: T})
    );
  });

  queue(id: string): Observable<T> {
    if (!this.isPending(id)) {
      this.queuePending(id);
    }
    return this.pendingFetches.get(id) as Observable<T>;
  }

  protected queueIds = this.queueIdsSubject.value;

  protected queuePending(id: string) {
    if (this.pendingFetches.has(id)) {
      throw new Error(`Already queued ${id}`);
    }
    this.pendingFetches.set(id, new AsyncSubject<T>());
    this.queueIdsSubject.next([...this.queueIds, id]);
  }

  protected isPending(id: string) {
    return this.pendingFetches.has(id);
  }

  protected resolvePending(id: string, resolved: T) {
    const subject = this.pendingFetches.get(id);
    if (subject === undefined) {
      throw new Error(`Attempted to resolve an id which hasn't been queued`);
    }
    subject.next(resolved);
    subject.complete();
    // Emit event saying that this id has been resolved.
    this.resolvedSubject.next([id, resolved]);
  }

  protected errorPending(id: string, error: Error) {
    const subject = this.pendingFetches.get(id);
    if (subject === undefined) {
      throw new Error(`Attempting to error an id which hasn't been queued`);
    }
    subject.error(error);
    subject.complete();
    this.resolvedSubject.error(error);
  }

  protected resolveNextBatch(options: {batchSize: number}): Observable<{[batchId: string]: T}> {
    const queueIds = [...this.queueIds];
    const batchIds = queueIds.splice(0, options.batchSize);
    this.queueIdsSubject.next(queueIds);

    return this.resolve(batchIds).pipe(
      tap((resolved: {[batchId: string]: T}) => {
        for (const [batchId, resolvedValue] of Object.entries(resolved)) {
          this.resolvePending(batchId, resolvedValue);
        }
      }),
      catchError(err => {
        batchIds.forEach(id => this.errorPending(id, err));
        return throwError(err);
      })
    );
  }

  init(options: { samplePeriod: number; batchSize: number; } = {
    samplePeriod: ModelResolveQueue.DEFAULT_SAMPLE_PERIOD,
    batchSize: ModelResolveQueue.DEFAULT_BATCH_SIZE
  }): Unsubscribable {
    const batchExecution = this.queueIdsSubject.pipe(
      filter(queue => queue.length > 0),
      sampleTime(options.samplePeriod),
      mergeMap(() => this.resolveNextBatch(options))
    ).subscribe();

    return {
      unsubscribe: () => {
        batchExecution.unsubscribe();
        for (const [id, pending] of this.pendingFetches.entries()) {
          if (!pending.closed) {
            pending.error(new Error(`Force close pending value ${id}: Fetch queue unsubscribed`));
            pending.complete();
          }
        }

        this.resolvedSubject.complete();
        this.queueIdsSubject.complete();
      }
    };

  }
}
