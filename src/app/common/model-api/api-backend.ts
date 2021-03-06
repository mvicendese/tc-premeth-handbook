import {Inject, Injectable, InjectionToken, Injector} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {isJsonObject, JsonObject} from '../json';
import {Observable, of, OperatorFunction, throwError} from 'rxjs';
import {toLowerCamelCase, transformKeys} from './model-key-transform';
import {map, switchMap} from 'rxjs/operators';

export const API_BASE_HREF = new InjectionToken<string>('API_BASE_HREF');

export abstract class ApiAuthenticationBackend {
  abstract authorizeHeaders(headers: HttpHeaders): HttpHeaders;
}

@Injectable({providedIn: 'root'})
export class ApiBackend {
  constructor(
    readonly injector: Injector,
    readonly http: HttpClient,
    @Inject(API_BASE_HREF)
    readonly apiBaseHref: string
  ) {
  }

  get authentication(): ApiAuthenticationBackend {
    return this.injector.get(ApiAuthenticationBackend);
  }

  apiUrl(path: readonly string[], params?: HttpParams | {[k: string]: string | readonly string[]}): string {
    return `${this.buildUrl(path)}?${this.asHttpParams(params)}`;
  }

  protected buildUrl(path: readonly string[]) {
    if (!/^\//.test(path[0] || '')) {
      throw new Error(`First path component must begin with an '/'`);
    }
    return this.apiBaseHref + [...path]
      .map(component => component.replace(/([^/])$/, '$1/'))
      .join('');
  }

  asHttpParams(params?: HttpParams | { [k: string]: string | readonly string[] }) {
    if (!(params instanceof HttpParams)) {
      params = new HttpParams({fromObject: params});
    }
    return params;
  }

  protected buildHeaders(
    headers?: HttpHeaders | { [k: string]: string | readonly string[] },
  ): HttpHeaders {
    if (!(headers instanceof HttpHeaders)) {
      headers = new HttpHeaders({...headers} as { [k: string]: string[] });
    }

    headers = headers.set('x-requested-with', 'XMLHttpRequest');
    if (!headers.has('authorize')) {
      headers = this.authentication.authorizeHeaders(headers);
    }
    return headers;
  }

  get(path: readonly string[], options: {
    params?: { [k: string]: string | readonly string[] } | HttpParams,
    headers?: { [k: string]: string | readonly string[] } | HttpHeaders,
  } = {}): Observable<JsonObject>{
    return this.http.get(this.buildUrl(path), {
      observe: 'body',
      params: this.asHttpParams(options.params),
      headers: this.buildHeaders(options.headers),
      responseType: 'json'
    }).pipe(
      checkIsJsonObjectResponse(),
      map(response => transformKeys(response, toLowerCamelCase)),
    );
  }

  post(path: readonly string[], body: JsonObject | string, options: {
    params?: HttpParams | { [k: string]: string | readonly string[] };
    headers?: HttpHeaders | { [k: string]: string | readonly string[] };
  } = {}): Observable<JsonObject> {
    return this.http.post(this.buildUrl(path), body, {
      observe: 'body',
      params: this.asHttpParams(options.params),
      headers: this.buildHeaders(options.headers),
      responseType: 'json'
    }).pipe(
      checkIsJsonObjectResponse(),
      map(response => transformKeys(response, toLowerCamelCase)),
    );
  }

  put(path: readonly string[], body: JsonObject, options: {
    headers?: HttpHeaders | { [k: string]: string | readonly string[] },
    params?: HttpParams | { [k: string]: string | readonly string[] },
  } = {}): Observable<JsonObject> {
    return this.http.put(this.buildUrl(path), body, {
      observe: 'body',
      params: this.asHttpParams(options.params),
      headers: this.buildHeaders(options.headers),
      responseType: 'json'
    }).pipe(
      checkIsJsonObjectResponse(),
      map(response => transformKeys(response, toLowerCamelCase)),
    );
  }
}

export function checkIsJsonObjectResponse(): OperatorFunction<unknown, JsonObject> {
  return switchMap((item: unknown) => {
    if (!isJsonObject(item)) {
      return throwError('Expected an object at root of http response');
    }
    return of(item);
  });
}
