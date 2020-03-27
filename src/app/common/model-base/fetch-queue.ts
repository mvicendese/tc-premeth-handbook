import {
  asyncScheduler,
  AsyncSubject,
  BehaviorSubject, combineLatest, concat, defer,
  EMPTY, merge,
  Observable, of,
  Subject,
  Subscription,
  throwError, timer,
  Unsubscribable,
  using, zip
} from 'rxjs';
import {Model} from './model';
import {getModelRefId, ModelRef} from './model-ref';
import {
  catchError,
  concatMap,
  delay,
  distinctUntilChanged,
  distinctUntilKeyChanged,
  filter,
  map, mapTo,
  mergeMap,
  sampleTime,
  scan, tap, withLatestFrom
} from 'rxjs/operators';
import {fromIterable, fromPromise} from 'rxjs/internal-compatibility';
import {ModelService, ModelServiceBackend} from './model-service';

type BatchError = Error & { batchIds: string[] };

export interface ModelFetchQueueOptions {
  /**
   * The number of ids to fetch per batch.
   * Should *NOT* be greater than the server's default page size.
   */
  batchSize: number;

  /**
   * Sample the queue for new queued items once every [samplePeriod] milliseconds.
   */
  samplePeriod: number;
}

export class ModelFetchQueue<T extends Model> {
  static readonly DEFAULT_BATCH_SIZE = 5;
  static readonly DEFAULT_SAMPLE_PERIOD = 50 /* ms */;

  private queueIdsSubject = new BehaviorSubject<string[]>([]);
  private modelResolvedSubject = new Subject<T>();
  private pendingFetches = new Map<string, AsyncSubject<T>>();

  readonly modelResolve: Observable<T> = this.modelResolvedSubject.asObservable();

  readonly allResolved$ = defer(() => {
    // All the values that we can get synchronously
    const completedFetches: Observable<[string, T]>[] = [];
    for (const [id, fetch] of this.pendingFetches.entries()) {
      completedFetches.push(zip(of(id), fetch));
    }

    return concat(
      merge(...completedFetches),
      this.modelResolvedSubject.pipe(map(model => [model.id, model] as [string, T]))
    ).pipe(
      scan(
        (acc, [id, model]) => ({...acc, [id]: model }),
        {} as {[k: string]: T}
      )
    );
  });

  protected get queueIds() {
    return this.queueIdsSubject.value;
  }

  isPending(ref: ModelRef<T>) {
    return this.pendingFetches.has(getModelRefId(ref));
  }

  getPending(ref: ModelRef<T>): Observable<T> {
    const id = getModelRefId(ref);
    if (this.isPending(id)) {
      return this.pendingFetches.get(id);
    }
    return throwError(new Error(`No current pending result for ${id}`));
  }

  protected addPending(ref: ModelRef<T>) {
    const id = getModelRefId(ref);
    this.pendingFetches.set(id, new AsyncSubject<T>());
    this.queueIdsSubject.next([...this.queueIds, id]);
  }

  protected resolvePending(ref: ModelRef<T>, resolved: T) {
    const subject = this.getPending(ref) as AsyncSubject<T>;
    subject.next(resolved);
    subject.complete();
  }

  protected errorPending(err: BatchError) {
    err.batchIds.forEach((id) => {
      const subject = this.getPending(id) as AsyncSubject<T>;
      subject.error(err);
      subject.complete();
    });
  }

  constructor(readonly service: ModelService<T>) {
  }

  queueFetch(ref: ModelRef<T>): Observable<T> {
    const id = getModelRefId(ref);

    let resolveComplete;
    const complete = new Promise<T>((resolve, reject) => {
      resolveComplete = resolve;
    });

    if (!this.isPending(id)) {
      this.addPending(id);
    }
    return this.getPending(id);
  }

  protected resolveNextBatch(options: { batchSize: number }): Observable<{ [batchId: string]: T }> {
    const queueIds = [...this.queueIds];
    const batchIds = queueIds.splice(0, options.batchSize);
    this.queueIdsSubject.next(queueIds);

    return this.service.resolve(batchIds).pipe(
      tap((resolved) => {
        for (const model of Object.values(resolved)) {
          this.modelResolvedSubject.next(model);
        }
      }),
      catchError(err => {
        (err as any).batchIds = batchIds;
        return throwError(err);
      })
    );
  }

  init(options: { samplePeriod: number, batchSize: number } = {
    samplePeriod: ModelFetchQueue.DEFAULT_SAMPLE_PERIOD,
    batchSize: ModelFetchQueue.DEFAULT_BATCH_SIZE
  }): Unsubscribable {
    const batchExecution = this.queueIdsSubject.pipe(
      filter(queue => queue.length > 0),
      sampleTime(options.samplePeriod),
      mergeMap(() => this.resolveNextBatch(options)),
    ).subscribe(
      (resolved: { [batchId: string]: T }) => {
        Object.entries(resolved).forEach(([id, value]) => this.resolvePending(id, value));
      },
      (err) => this.errorPending(err as BatchError),
    );
    return {
      unsubscribe: () => {
        batchExecution.unsubscribe();
        for (const pending of this.pendingFetches.values()) {
          if (!pending.closed) {
            pending.error(new Error(`Force close pending value: Fetch queue unsubscribe.`));
            pending.complete();
          }
        }
        this.modelResolvedSubject.complete();
        this.queueIdsSubject.complete();
      }
    };
  }
}
