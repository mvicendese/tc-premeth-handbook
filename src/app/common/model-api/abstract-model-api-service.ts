import {ApiBackend, checkIsJsonObjectResponse} from './api-backend';
import {Model} from '../model-base/model';
import {HttpHeaders, HttpParams} from '@angular/common/http';
import {Decoder, JsonObject} from '../json';
import {Observable, of, throwError} from 'rxjs';
import {ResponseCursor, ResponseCursorFactory} from './response-cursor';
import {ResponsePage, ResponsePageFactory} from './response-page';
import {isRefModel, Ref} from '../model-base/ref';
import {map} from 'rxjs/operators';
import {toLowerCamelCase, transformKeys} from './model-key-transform';


export abstract class AbstractModelApiService<T extends Model> {
  protected constructor(
    readonly backend: ApiBackend,
    readonly basePath: string[],
  ) {
  }

  // The default decoder. Used only by `fetch`.
  abstract fromJson<U extends T>(obj: unknown): U;

  protected addFormatParam(params?: HttpParams | { [k: string]: string | readonly string[] }): HttpParams {
    return this.backend.asHttpParams(params)
      .set('format', 'json');
  }

  protected detailPath(ref: Ref<T>, ...extra: readonly string[]) {
    return [ref.id, ...extra];
  }

  protected absPath(path: readonly string[]): string[] {
    return [...this.basePath, ...path];
  }

  fetch<U extends T>(ref: Ref<U>): Observable<U> {
    if (isRefModel(ref)) {
      return of(ref);
    } else {
      return this.backend.get(this.detailPath(ref)).pipe(
        map((obj) => this.fromJson(obj))
      );
    }
  }

  fetchAll(refs: readonly string[]): Observable<T[]> {
    return this.query([], {
      params: {resolve: refs.join(',')},
      itemDecoder: (obj) => this.fromJson(obj)
    }).pipe(
      // The resolve parameter will always only return a single page of results
      map(page => page.results)
    );
  }

  protected select<U extends Model = T>(path: string[], {params, headers, itemDecoder}: {
    params?: HttpParams | { [k: string]: string | readonly string[] };
    headers?: HttpHeaders | { [k: string]: string | readonly string[] };
    itemDecoder: Decoder<U>;
  }): Observable<ResponseCursor<U>> {
    return new ResponseCursorFactory(this.backend, {
        path: this.absPath(path),
        params: this.addFormatParam(params),
        headers,
        itemDecoder
    }).create();
  }

  protected query<U extends object>(path: string[], {params, itemDecoder}: {
    params: HttpParams | { [k: string]: string | readonly string[] },
    itemDecoder: Decoder<U>
  }): Observable<ResponsePage<U>> {
    return new ResponsePageFactory(this.backend, {
      path: this.absPath(path),
      params: this.addFormatParam(params),
      itemDecoder
    }).create();
  }

  /**
   * queryUnique is for fetching a single item from the server, where the id is not known
   * in advance, but the response is known to be unique.
   */
  protected queryUnique<U extends object>(path: string[], options: {
    params: HttpParams | { [k: string]: string | readonly string[] };
    headers?: HttpHeaders | { [k: string]: string | readonly string[] };
    decoder: Decoder<U>
  }) {
    return this.query<U>(path, {...options, itemDecoder: options.decoder}).pipe(
      map(page => {
        if (page.count === 0) {
          throw new Error('Expected a unique object, but query returned 0 results');
        } else if (page.count > 1) {
          throw new Error('Expected a unique object, but query returned multiple results');
        }
        return page.results[0]!;
      })
    );
  }

  protected selectProperty(basePath: string[], ref: Ref<T>, property: keyof T, {params, headers, itemDecoder}: {
    params?: HttpParams | { [k: string]: string | readonly string[] };
    headers?: HttpHeaders | { [k: string]: string | readonly string[] };
    itemDecoder: Decoder<any /* item type of T[K] */>;
  }): Observable<ResponseCursor<any /* item<T[K]> */>> {
    const cursorFactory = new ResponseCursorFactory<any>(this.backend, {
      path: this.detailPath(ref, property.toString()),
      params: this.addFormatParam(params),
      headers,
      itemDecoder
    });

    if (isRefModel(ref)) {
      const precached = ref[property] as any;
      const count = (ref as any)[property.toString() + 'Count'];
      if (typeof count !== 'number') {
        throw new Error('A selectable property must have an associated \'<name>Count\' property, whose value is a number');
      }
      return cursorFactory.create(count, precached);
    } else {
      return cursorFactory.create();
    }
  }

  protected queryProperty(ref: Ref<T>, property: keyof T, {params, headers, itemDecoder}: {
    params?: HttpParams | { [k: string]: string | readonly string[] };
    headers?: HttpHeaders | { [k: string]: string | readonly string[] };
    itemDecoder: Decoder<any /* item type of T[K] */>
  }): Observable<ResponsePage<any /* item type of T[K] */>> {
    const pageFactory = new ResponsePageFactory(this.backend, {
      path: this.detailPath(ref, property.toString()),
      params: this.addFormatParam(params),
      headers,
      itemDecoder
    });

    if (isRefModel(ref)) {
      const precached = ref[property] as any;
      const count = (ref as any)[property.toString() + 'Count'];
      if (typeof count !== 'number') {
        return throwError(new Error('A queryable property must have an associated \'<name>Count property, whose value is a number'));
      }

      return pageFactory.create(count, precached);
    } else {
      return pageFactory.create();
    }
  }

  protected get<R>(path: readonly string[], {params, headers, decoder}: {
    params?: HttpParams | { [k: string]: string | readonly string[] },
    headers?: HttpHeaders | { [k: string]: string | readonly string[] },
    decoder: Decoder<R>
  }): Observable<R> {
    return this.backend.get(this.absPath(path), { params: this.addFormatParam(params), headers}).pipe(
      map(response => decoder(response))
    );
  }

  post<R>(path: readonly string[], body: JsonObject, {params, headers, decoder}: {
    params?: HttpParams | { [k: string]: string | readonly string[] };
    headers?: HttpHeaders | { [k: string]: string | readonly string[] };
    decoder: Decoder<R>
  }): Observable<R> {
    return this.backend.post(this.absPath(path), body, {params: this.addFormatParam(params), headers}).pipe(
      map(response => decoder(response))
    );
  }

  postDetail<R>(ref: Ref<T>, path: string[], body: JsonObject, options: {
    params?: HttpParams | { [k: string]: string | readonly string[] };
    headers?: HttpHeaders | { [k: string]: string | readonly string[] };
    decoder: Decoder<R>;
  }) {
    return this.post(this.detailPath(ref, ...path), body, options);
  }

  put<R>(path: readonly string[], body: JsonObject, {params, headers, decoder}: {
    headers?: HttpHeaders | { [k: string]: string | readonly string[] },
    params?: HttpParams | { [k: string]: string | readonly string[] },
    decoder: Decoder<R>
  }): Observable<R> {
    return this.backend.put(this.absPath(path), body, {params: this.addFormatParam(params), headers}).pipe(
      map(response => decoder(response))
    );
  }

  putDetail<R>(ref: Ref<T>, path: string[], body: JsonObject, options: {
    params?: HttpParams | { [k: string]: string | readonly string[] };
    headers?: HttpHeaders | { [k: string]: string | readonly string[] };
    decoder: Decoder<R>;
  }) {
    return this.put(this.detailPath(ref, ...path), body, options);
  }
}

