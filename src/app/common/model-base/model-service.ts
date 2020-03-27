import {Inject, Injectable, InjectionToken} from '@angular/core';
import {Model, ModelParams} from './model';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {isModelRefId, ModelRef} from './model-ref';
import {defer, iif, Observable, of, throwError, Unsubscribable} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {modelServiceResponsePageFactory, ResponsePage, ResponsePageOptions} from './pagination';
import {JsonObject, transformKeys} from './model-key-transform';

export const API_BASE_HREF = new InjectionToken<string>('API_BASE_HREF');

@Injectable()
export class ModelServiceBackend {
  constructor(
    readonly http: HttpClient,

    @Inject(API_BASE_HREF)
    readonly apiBaseHref: string
  ) {}

  private readonly modelCacheHandlers = new WeakMap<ModelService<any>, ReadonlyArray<(model: Model) => void>>();

  addCacheHandler<T extends Model = Model>(service: ModelService<any>, handler: (model: T) => void): Unsubscribable {
    const cacheHandlers = this.getCacheHandlers(service);
    this.modelCacheHandlers.set(service, [...cacheHandlers, handler]);

    return {
      unsubscribe: () => {
        const cacheHandlers1 = [...this.getCacheHandlers(service)];
        const index = cacheHandlers.indexOf(handler);
        delete cacheHandlers1[index];

        this.modelCacheHandlers.set(service, cacheHandlers1);
      }
    };
  }

  getCacheHandlers<T extends Model = Model>(service: ModelService<T>): ReadonlyArray<(model: T) => void> {
    return (this.modelCacheHandlers.get(service) || []) as ReadonlyArray<(model: Model) => void>;
  }

  get(path: string, params?: {[k: string]: string | string[]}): Observable<JsonObject> {
    params = Object.assign({}, params, {format: 'json'});
    return this.http.get<JsonObject>([this.apiBaseHref, path].join(''), {
      params,
      observe: 'body',
      headers: {
        'x-requested-with': 'XMLHttpRequest'
      }
    }).pipe(
      map((item) => transformKeys(item))
    );
  }
}

export abstract class ModelService<T extends Model> {
  private readonly createResponsePage = modelServiceResponsePageFactory(this.backend, this.path);

  abstract fromObject(obj: JsonObject): T;

  protected constructor(
    protected backend: ModelServiceBackend,
    readonly path: string,
  ) {}

  fetch(ref: ModelRef<T>): Observable<T> {
    return iif(
      () => isModelRefId(ref),
      defer(() => this.backend.get([this.path, ref].join('/'))).pipe(
        map((params) => this.fromObject(params))
      ),
      of(this.fromObject(ref as JsonObject))
    );
  }

  resolve(ids: readonly string[]): Observable<{[id: string]: T}> {
    return this.query('', { params: { resolve: [...ids] }}).pipe(
      // There will only be at most one page, because there is a 1-[0..1] correspondence between ids and results
      map(page => Object.fromEntries<T>(page.results.map(item => [item.id, item])))
    );
  }

  query<U extends ModelParams = T>(path: string, options: {
    params: {[k: string]: string | string[]};
    useDecoder?: (obj: JsonObject) => U
  }): Observable<ResponsePage<U>> {
    path = this.path + path;
    const sOptions: ResponsePageOptions<U> = {
      ...options,
      useDecoder: options && options.useDecoder || this.fromObject.bind(this)
    };

    const params = options.params;
    Object.entries(params)
      .filter(([_, value]) => value === undefined)
      .forEach(([key]) => delete params[key]);

    return this.backend.get(path, options && options.params).pipe(
      /** FIXME: Theses types are _definitely_ wrong */
      map(data => this.createResponsePage(path, sOptions as any, data) as any as ResponsePage<U>)
    );
  }

  /**
   * A version of query for use when the returned result is known to be unique.
   *
   * @param path: string
   * An extra component for the path
   *
   * @param options: object
   */
  queryUnique<U = T>(path: string, options?: {
    params: {[k: string]: string | string[]};
    useDecoder?: (obj: JsonObject) => U;
  }): Observable<U | null> {
    path = this.path + path;
    const params = options && options.params;
    const decoder = options && options.useDecoder || this.fromObject.bind(this);
    return this.backend.get(path, params).pipe(
      map(obj => {
        if (!Array.isArray(obj.results)) {
          throw new Error(`Expected an array`);
        }
        switch (obj.results.length) {
          case 0:
            return null;
          case 1:
            return decoder(obj.results[0]);
          default:
            throw new Error(`Expected a unique object to be returned from this query`);
        }
      }),
      catchError((err) => {
        if (err instanceof HttpErrorResponse && err.status === 404) {
          return of(null);
        }
        return throwError(err);
      })
    );
  }

}

