import {isObservable, Observable, of, Operator, OperatorFunction} from 'rxjs';
import {Injectable, Provider} from '@angular/core';
import {map, scan} from 'rxjs/operators';
import json, {Decoder, isJsonObject, JsonObject, JsonObjectProperties} from '../json';

export interface Model extends JsonObject {
  readonly type: string;
  readonly id: string;
}

export abstract class BaseModel implements Model {
  readonly type: string;
  readonly id: string;
  readonly [k: string]: unknown;

  constructor(readonly params: Model) {
    this.type = params.type;
    this.id = params.id;
  }
}

export function modelProperties(type: string): JsonObjectProperties<Model> {
  return { type, id: json.string };
}

export function modelFromJson(type: string, obj?: unknown): Decoder<Model> | Model {
  return json.object(modelProperties(type), obj);
}

export function isModel<T extends Model>(type: T['type'], obj: unknown): obj is Model {
  return isJsonObject(obj)
    && (obj as any).type === type
    && typeof (obj as any).id === 'string';
}

export interface ModelMap<T extends Model> {
  [id: string]: T;
}

export function scanIntoModelMap<T extends Model>(): OperatorFunction<T, ModelMap<T>> {
  return scan(
    (acc, model) => ({...acc, [model.id]: model}),
    {} as {[k: string]: T}
  );
}

