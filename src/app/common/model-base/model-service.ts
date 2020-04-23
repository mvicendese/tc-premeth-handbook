import {Inject, Injectable, InjectionToken} from '@angular/core';
import {Model} from './model';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {ModelRef} from './model-ref';
import {defer, iif, Observable, of, throwError} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {modelServiceResponsePageFactory, ResponsePage, ResponsePageOptions} from './pagination';
import {toLowerCamelCase, toUnderscoreCase, transformKeys} from './model-key-transform';
import {Decoder, JsonObject} from '../json';

export const API_BASE_HREF = new InjectionToken<string>('API_BASE_HREF');

const STANDARD_HEADERS = {
  'x-requested-with': 'XMLHttpRequest'
};

const DEFAULT_PARAMS = {
  format: 'json'
};

@Injectable()
export class ModelServiceBackend {

  constructor(
    readonly http: HttpClient,
    @Inject(API_BASE_HREF)
    readonly apiBaseHref: string
  ) {
  }

  protected normalPath(path: string | string[]) {
    const components = typeof path === 'string' ? [path] : path;
    if (!/^\//.test(components[0] || '')) {
      throw new Error(`First path component must begin with an '/'`);
    }
    return this.apiBaseHref + [...components]
      .map(component => component.replace(/([^/])$/, '$1/'))
      .join('');
  }

  get(path: string | string[], params?: { [k: string]: string | string[] }): Observable<JsonObject> {
    params = Object.assign({}, DEFAULT_PARAMS, params);
    return this.http.get<JsonObject>(this.normalPath(path), {
      params,
      observe: 'body',
      headers: STANDARD_HEADERS
    }).pipe(
      map((item) => transformKeys(item, toLowerCamelCase))
    );
  }

  post(path: string | string[], body: JsonObject, options: {
    params?: { [k: string]: string | string[] };
  }): Observable<JsonObject> {
    const params = Object.assign({}, DEFAULT_PARAMS, options.params);
    return this.http.post<JsonObject>(
      this.normalPath(path),
      transformKeys(body, toUnderscoreCase),
      {
        observe: 'body',
        headers: STANDARD_HEADERS,
        params
      }
    ).pipe(
      map(item => transformKeys(item, toLowerCamelCase)),
    );
  }

  put(path: string | string[], body: JsonObject, options: {
    params?: { [k: string]: string | string[] }
  } = {}): Observable<JsonObject> {
    const params = Object.assign({}, DEFAULT_PARAMS, options.params);
    return this.http.put<JsonObject>(
      this.normalPath(path),
      transformKeys(body, toUnderscoreCase),
      {
        observe: 'body',
        headers: STANDARD_HEADERS,
        params
      }
    ).pipe(
      map(item => transformKeys(item, toLowerCamelCase))
    );
  }
}

export abstract class ModelService<T extends Model> {
  private readonly createResponsePage = modelServiceResponsePageFactory(this.backend, this.path);

  /**
   * The default decoder to use when processing results.
   * @param obj
   */
  abstract fromJson(obj: unknown): T;

  protected constructor(
    protected backend: ModelServiceBackend,
    readonly path: string
  ) {
  }

  fetch(ref: ModelRef<T>): Observable<T> {
    return iif(
      () => ModelRef.isId(ref),
      defer(() => this.backend.get([this.path, ref].join('/'))).pipe(
        map((params) => this.fromJson(params))
      ),
      of(this.fromJson(ref))
    );
  }

  put<Result extends object = T>(path: string, body: JsonObject, options: {
    params?: { [k: string]: string | string[] },
    useDecoder?: (obj: unknown) => Result;
  } = {}): Observable<Result> {
    const decoder = options.useDecoder || this.fromJson.bind(this);
    return this.backend.put([this.path, path], body, options).pipe(
      map(decoder)
    );
  }

  post<Result extends object = T>(path: string, body: JsonObject, options: {
    params?: { [k: string]: string | string[] },
    useDecoder?: (obj: unknown) => Result;
  } = {}): Observable<Result> {
    const decoder = options.useDecoder || this.fromJson.bind(this);
    return this.backend.post([this.path, path].join('/'), body, options).pipe(
      map(decoder)
    );
  }

  resolve(ids: readonly string[]): Observable<{ [id: string]: T }> {
    return this.query('', {params: {resolve: [...ids]}}).pipe(
      // There will only be at most one page, because there is a 1-[0..1] correspondence between ids and results
      map(page => Object.fromEntries<T>(page.results.map(item => [item.id, item])))
    );
  }

  query<Result extends object = T>(path: string,
                                   options: {
                                     params: { [k: string]: string | string[] };
                                     useDecoder?: Decoder<Result>
                                   }): Observable<ResponsePage<Result>> {
    path = this.path + path;
    const sOptions: ResponsePageOptions<Result> = {
      ...options,
      useDecoder: options && options.useDecoder || this.fromJson.bind(this)
    };

    const params = options.params;
    Object.entries(params)
      .filter(([_, value]) => value === undefined)
      .forEach(([key]) => delete params[key]);

    return this.backend.get(path, options && options.params).pipe(
      /** FIXME: Theses decoders are _definitely_ wrong */
      map(data => this.createResponsePage(path, sOptions as any, data) as any as ResponsePage<Result>)
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
    params: { [k: string]: string | string[] };
    useDecoder?: (obj: JsonObject) => U;
  }): Observable<U | null> {
    path = this.path + path;
    const params = options && options.params;
    const decoder = options && options.useDecoder || this.fromJson.bind(this);
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

