import json from '../json';

import {Model} from './model';
import {Decoder, isJsonObject, JsonObject} from '../json';


export type ModelRef<T extends Model> = string | T;

/**
 * Represents a model where the properties in K (which are assumed to be of type `ModelRef` in T),
 * are replaced by their corresponding server objects.
 *
 * ie. Given
 *
 *  interface MyModel extends Model {
 *    myProp: ModelRef<SomeModel>;
 *  }
 *
 *  then Resolve<MyModel, 'myProp'> would represent the interface
 *
 *  interface ResolvedMyModel extends Model {
 *    myProp: SomeModel;
 *  }
 */
export type Resolve<T extends object, K extends keyof T> = {
  [K1 in keyof T]: K1 extends K ? Exclude<T[K1], string> : T[K1];
};

export function isRefId(ref: unknown): ref is string {
  return typeof ref === 'string';
}
export function isRefModel<T extends Model>(ref: ModelRef<T> | null): ref is T {
  return isJsonObject(ref);
}

export function modelRefId(ref: ModelRef<any>): string {
  if (ref === undefined) {
    throw new Error(`Undefined ref`);
  }
  if (isRefId(ref)) {
    return ref;
  } else {
    return ref.id;
  }
}

export function modelRefModel<T extends Model>(ref: ModelRef<T>): T {
  if (isRefId(ref)) {
    throw new Error(`Unresolved ref: ${ref}`);
  }
  return ref;
}

export function modelRefFromJson<T extends Model>(obj: ModelRef<T>): ModelRef<T>;
export function modelRefFromJson<T extends Model>(fromObject?: (obj: JsonObject) => T): Decoder<ModelRef<T>>;
export function modelRefFromJson<T extends Model>(fromObject: (obj: JsonObject) => T, ref: ModelRef<T>): ModelRef<T>;

export function modelRefFromJson<T extends Model>(fromObject: ((obj: JsonObject) => T | ModelRef<T>), ref?: ModelRef<T>): Decoder<ModelRef<T>> | ModelRef<T> {
  ref = typeof fromObject === 'function' ? ref : fromObject;
  return json.union(
    obj => typeof obj as "string" | "object",
    {
      string: (obj) => obj as ModelRef<T>,
      object: (obj) => {
        if (isJsonObject(fromObject)) {
          return fromObject;
        }
        return fromObject(obj as JsonObject);
      }
    },
    ref
  );
}

