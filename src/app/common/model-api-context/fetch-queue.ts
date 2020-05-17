import {Model} from '../model-base/model';
import {ModelResolveQueue, ResolveQueueOptions} from './resolve-queue';
import {AbstractModelApiService} from '../model-api/abstract-model-api-service';
import {map} from 'rxjs/operators';
import {Ref} from '../model-base/ref';
import {Observable} from 'rxjs';

/**
 * A fetch queue is just a simple [:ResolveQueue:] which fetches
 * models by their ref.
 */
export class ModelFetchQueue<T extends Model> {
  readonly resolveQueue: ModelResolveQueue<T>;

  constructor(
    readonly service: AbstractModelApiService<T>
  ) {
    this.resolveQueue = new ModelResolveQueue(
      (batchIds) => this.service.fetchAll(batchIds).pipe(
        map((items) => Object.fromEntries(items.map(item => [item.id, item])))
      )
    );
  }

  queueFetch<U extends T>(ref: Ref<U>, {force} = {force: false}): Observable<U> {
    return this.resolveQueue.queue(ref.id, {force}) as Observable<U>;
  }

  init(options?: ResolveQueueOptions) {
    return this.resolveQueue.init(options);
  }

  get allResolved$() {
    return this.resolveQueue.allResolved$;
  }

}
