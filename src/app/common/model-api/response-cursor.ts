import {Observable, of, OperatorFunction} from 'rxjs';
import json, {Decoder, JsonObject} from '../json';
import {ApiBackend} from './api-backend';
import {Injectable} from '@angular/core';
import {HttpHeaders, HttpParams} from '@angular/common/http';
import {map, switchMap} from 'rxjs/operators';
import {Model} from '../model-base/model';


export interface ResponseCursor<T extends object> {
  readonly results: T[];
  readonly count: number;
  readonly cursor: string;

  readonly hasMore: boolean;
  more(): Observable<ResponseCursor<T>>;
}

export class ResponseCursorFactory<T extends {readonly id: string}> {
  constructor(
    readonly backend: ApiBackend,
    readonly request: {
      path: readonly string[],
      params?: HttpParams | {[k: string]: string | readonly string[] },
      headers?: HttpHeaders | {[k: string]: string | readonly string[] },
      itemDecoder: Decoder<T>
    }
  ) {}

  protected fromResponse(response: JsonObject, initial: T[] = []): Observable<ResponseCursor<T>> {
    const {count, results} = json.object({
      count: json.number,
      results: json.array(this.request.itemDecoder)
    }, response);
    return this.create(count, results);
  }

  create(initialCount?: number, precached: T[] = []): Observable<ResponseCursor<T>> {
    const lastItem = precached[precached.length - 1];
    const cursor = lastItem ? lastItem.id : '';

    const more = () => {
      const params = this.backend.asHttpParams(this.request.params).set('cursor', cursor);
      return this.backend.get(this.request.path, {params, headers: this.request.headers}).pipe(
        switchMap(response => this.fromResponse(response, precached))
      )
    }

    if (initialCount === undefined) {
      return more();
    }

    return of({
      cursor,
      count: initialCount,
      results: precached,
      hasMore: true,
      more,
    });
  }
}
