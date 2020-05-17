import json, {Decoder, JsonObject} from '../json';
import {Observable, of} from 'rxjs';
import {HttpHeaders, HttpParams} from '@angular/common/http';
import {ApiBackend} from './api-backend';
import {map} from 'rxjs/operators';

export interface ResponsePage<T extends object> {
  readonly results: T[];
  readonly count: number;
  readonly pageNumber: number;

  readonly hasNext: boolean;
  readonly hasPrevious: boolean;

  next(): Observable<ResponsePage<T> | null>;
  previous(): Observable<ResponsePage<T> | null>;

  gotoPage(pageNumber: number | 'last'): Observable<ResponsePage<T>>;
}

export class ResponsePageFactory<T extends object> {
  constructor(
    readonly backend: ApiBackend,
    readonly request: {
      path: readonly string[],
      params?: HttpParams | { [k: string]: string | readonly string[] },
      headers?: HttpHeaders | { [k: string]: string | readonly string[] },
      itemDecoder: Decoder<T>
    }
  ) {
  }

  create(precachedCount?: number, precachedPage: T[] = []): Observable<ResponsePage<T>> {
    if (precachedCount === undefined) {
      const {path, params, headers} = this.request;
      return this.backend.get(path, {params, headers}).pipe(
        map(response => this.createFromResponse(response))
      );
    }

    return of(this.createFromPrecachedResults(precachedPage, precachedCount));
  }

  protected _create(results: T[], count: number, pageNumber: number, hasPrevious: boolean, hasNext: boolean): ResponsePage<T> {
    const gotoPage = (destinationPage: number | 'last'): Observable<ResponsePage<T>> => {
      const {path, headers} = this.request;
      const params = this.backend.asHttpParams(this.request.params)
        .set('page', destinationPage.toString())
      return this.backend.get(path, {params, headers}).pipe(
        map(response => this.createFromResponse(response))
      )
    };

    return {
      results,
      count,
      pageNumber,
      hasNext,
      hasPrevious,
      gotoPage,
      next: () => hasNext ? gotoPage(pageNumber + 1) : of(null),
      previous: () => hasPrevious ? gotoPage(pageNumber - 1) : of(null),
    }
  }

  protected createFromResponse(response: JsonObject): ResponsePage<T> {
    const { results, count, pageNumber, next, previous } = json.object({
      results: json.array(this.request.itemDecoder),
      count: json.number,
      pageNumber: json.number,
      next: json.nullable(json.string),
      previous: json.nullable(json.string),
    }, response);

    return this._create(results, count, pageNumber, previous != null, next != null);
  }

  protected createFromPrecachedResults(results: T[], count: number): ResponsePage<T> {
    return this._create(results, count, 1, false, count > results.length);
  }
}


