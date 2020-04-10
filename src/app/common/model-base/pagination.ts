import {ModelServiceBackend} from './model-service';
import {Observable} from 'rxjs';
import {Model} from './model';
import {map} from 'rxjs/operators';
import {Decoder, JsonObject} from '../json';
import {modelRefId} from './model-ref';

export interface ResponsePageOptions<T> {
  params: { [k: string]: string | string[] };
  useDecoder: Decoder<T>;
}

export interface ResponsePageData extends JsonObject {
  count: number;
  results: JsonObject[];
}

export class ResponsePage<T extends object> {

  get params() {
    return this.options.params;
  }

  get pageNumber(): number {
    return +this.params.page;
  }

  constructor(
    protected readonly backend: ModelServiceBackend,
    readonly path: string,
    readonly options: ResponsePageOptions<T>,
    readonly data: ResponsePageData
  ) {
  }

  get results() {
    return this.data.results.map(result => this.options.useDecoder(result as JsonObject));
  }

  resultMap<K extends keyof T>(key: (obj: T) => T[K]): Record<K, T> {
    const keyFn = key || modelRefId;
    return Object.fromEntries( this.results.map(result => {
      const key = keyFn(result);
      if (key == null) {
        throw new Error(`Key function should not return 'null' or 'undefined'`);
      }
      return [key, result]
    }));
  }

  first() {
    return this.page(1);
  }

  last() {
    return this.page('last');
  }

  next() {
    return this.page(this.pageNumber + 1);
  }

  previous() {
    return this.page(this.pageNumber - 1);
  }

  page(index: number | 'last'): Observable<ResponsePage<T>> {
    const params: { [k: string]: string | string[] } = {...this.params, page: `${index}`};
    return this.backend.get(this.path, params).pipe(
      map(obj => this._loadPage(params, obj as {count: number, results: JsonObject[]}))
    );
  }

  private _loadPage(
    params: {[k: string]: string | string[]},
    page: {count: number, results: JsonObject[]},
  ): ResponsePage<T> {
    return new ResponsePage(this.backend, this.path, {...this.options, params}, page);
  }
}

export function modelServiceResponsePageFactory<T extends Model>(serviceBackend: ModelServiceBackend, servicePath: string) {
  return (path: string, options: ResponsePageOptions<T>, data) => {
    if (!path.endsWith('/')) {
      path += '/';
    }
    return new ResponsePage<T>(serviceBackend, servicePath + path, options, data);
  };
}


