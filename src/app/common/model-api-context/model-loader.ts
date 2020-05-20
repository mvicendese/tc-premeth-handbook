import {Model} from '../model-base/model';
import {BehaviorSubject, Observable, of, Unsubscribable} from 'rxjs';
import {ModelFetchQueue} from './fetch-queue';

import {Set} from 'immutable';
import {first, map} from 'rxjs/operators';
import {Ref} from '../model-base/ref';
import {AbstractModelApiService} from '../model-api/abstract-model-api-service';

export interface ModelLoader<T extends Model> {
  load<U extends T>(ref: Ref<U>, options?: {force: boolean}): Observable<U>;
  load<U extends T>(ref: Ref<U> | null, options?: {force: boolean}): Observable<U | null>;

  isLoading<U extends T>(ref: Ref<U>): Observable<boolean>;

  loadWith<U extends T>(ref: Ref<U>, value: U): void;

  init(): Unsubscribable;
}

// tslint:disable-next-line:class-name
export abstract class _ModelLoader<T extends Model> implements ModelLoader<T> {
  readonly loadingIdsSubject = new BehaviorSubject(Set<string>());

  readonly loadingIds = this.loadingIdsSubject.pipe()

  protected constructor(
    readonly apiService: AbstractModelApiService<T>,
  ) {}

  protected readonly fetchQueue = new ModelFetchQueue(this.apiService);

  load<U extends T>(ref: Ref<U>, options?: {force: boolean}): Observable<U>;
  load<U extends T>(ref: Ref<U> | null, options?: {force: boolean}): Observable<U | null>;

  load<U extends T>(ref: Ref<U> | null, options: {force} = {force: false}): Observable<U | null> {
    if (ref == null) { return of(null); }
    this.loadingIdsSubject.next(this.loadingIdsSubject.value.add(ref.id))
    return this.fetchQueue.queueFetch(ref, {force: options.force});
  }

  loadWith<U extends T>(value: U): void {
    this.fetchQueue.queueFetch(value);
  }

  isLoading<U extends T>(ref: Ref<U>): Observable<boolean> {
    return this.loadingIdsSubject.pipe(map(loadingIds => loadingIds.has(ref.id)), first());
  }

  init() {
    const fetchQueueResource = this.fetchQueue.init();
    this.fetchQueue.allResolved$.subscribe(resolved => {
      const resolvedIds = Object.keys(resolved);
      const loadingIds = this.loadingIdsSubject.value;
      this.loadingIdsSubject.next(loadingIds.subtract(resolvedIds));
    })
    return {
      unsubscribe() {
        fetchQueueResource.unsubscribe();
        this.loadingIdsSubject.unsubscribe();
      }
    }
  }
}

