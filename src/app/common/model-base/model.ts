import {v4 as uuid4} from 'uuid';

import {isObservable, Observable, of, Operator, OperatorFunction} from 'rxjs';
import {Injectable, Provider} from '@angular/core';
import {map, scan} from 'rxjs/operators';
import json, {Decoder, isJsonObject, JsonObject, JsonObjectProperties} from '../json';
import {ModelRef, modelRefId} from './model-ref';

export interface Model extends JsonObject {
  readonly type: string;
  readonly id: string;

  readonly createdAt: Date | null;
  readonly updatedAt: Date | null;
}

export abstract class BaseModel implements Model {
  readonly type: string;
  readonly id: string;
  readonly [k: string]: unknown;

  readonly createdAt: Date | null;
  readonly updatedAt: Date | null;

  protected constructor(readonly params: Model) {
    this.type = params.type;
    this.id = params.id;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }
}

export function modelProperties(type: string): JsonObjectProperties<Model> {
  return { type, id: json.string };
}
export function createModel<T extends Model>(type: T['type']) {
  return { type, id: uuid4() };
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

export function scanIntoModelMap<T extends Model>(key?: (model: T) => string): OperatorFunction<T, ModelMap<T>> {
  key = key || modelRefId;
  return scan(
    (acc, model) => ({...acc, [model.id]: model}),
    {} as {[k: string]: T}
  );
}

