import {isObservable, Observable, of, Operator, OperatorFunction} from 'rxjs';
import {Injectable, Provider} from '@angular/core';
import {map, scan} from 'rxjs/operators';
import {JsonObject} from './model-key-transform';

export interface ModelParams {
  readonly type: string;
  readonly id: string;
}

export function parsModeParams(obj: JsonObject) {
  return {
    type: obj.type,
    id: obj.id
  };
}


export function isModelParams<T extends Model>(type: T['type'], obj: unknown): obj is ModelParams {
  return obj != null && typeof obj === 'object'
      && typeof (obj as any).id === 'string'
      && (obj as any).type === type;
}

export abstract class Model {
  abstract readonly type: string;
  readonly id: string;

  protected constructor(readonly params: ModelParams) {
    this.id = params.id;
  }

  set<K extends keyof this>(prop: K, value: this[K]): this {
    return new (Object.getPrototypeOf(this).constructor)({...this, [prop]: value});
  }
}

export type ModelProjection<T extends Model> = Partial<T> & ModelParams;

export function scanIntoModelMap<T extends Model>(): OperatorFunction<T, {[id: string]: T}> {
  return scan(
    (acc, model) => ({...acc, [model.id]: model}),
    {} as {[k: string]: T}
  );
}

