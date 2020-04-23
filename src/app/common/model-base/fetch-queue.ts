import {AsyncSubject, BehaviorSubject, concat, defer, merge, Observable, of, Subject, throwError, Unsubscribable, zip} from 'rxjs';
import {Model} from './model';
import {ModelRef} from './model-ref';
import {catchError, filter, map, mergeMap, sampleTime, scan, tap} from 'rxjs/operators';
import {ModelService} from './model-service';
import {ModelResolveQueue, ResolveQueueOptions} from './resolve-queue';

/**
 * A fetch queue is just a simple [:ResolveQueue:] which fetches
 * models by their ref.
 */
export class ModelFetchQueue<T extends Model> {
  readonly resolveQueue: ModelResolveQueue<T>;

  constructor(
    readonly service: ModelService<T>
  ) {
    this.resolveQueue = new ModelResolveQueue(
      (batchIds) => this.service.resolve(batchIds)
    );
  }

  queueFetch(ref: ModelRef<T>) {
    return this.resolveQueue.queue(ModelRef.id(ref));
  }

  init(options?: ResolveQueueOptions) {
    return this.resolveQueue.init(options);
  }

  get allResolved$() {
    return this.resolveQueue.allResolved$;
  }

}
