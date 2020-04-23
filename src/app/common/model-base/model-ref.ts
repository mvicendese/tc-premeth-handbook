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

export const ModelRef = {
  isId: (ref: unknown): ref is string => typeof ref === 'string',
  isModel: <T extends Model>(ref: ModelRef<T> | null): ref is T => isJsonObject(ref),

  id: (ref: ModelRef<any>) => {
    if (ref === undefined) {
      throw new Error(`Undefined ref`);
    }
    if (ModelRef.isId(ref)) {
      return ref;
    } else {
      return ref.id;
    }
  },
  model: <T extends Model>(ref: ModelRef<T>): T => {
    if (ModelRef.isId(ref)) {
      throw new Error(`Unresolved ref: ${ref}`);
    }
    return ref;
  },

  fromJson: modelRefFromJson
};

function modelRefFromJson<T extends Model>(fromObject: (obj: JsonObject) => T): Decoder<ModelRef<T>>;
function modelRefFromJson<T extends Model>(fromObject: (obj: JsonObject) => T, obj: unknown): ModelRef<T>;
function modelRefFromJson<T extends Model>(fromObject: (obj: JsonObject) => T, obj?: unknown): Decoder<ModelRef<T>> | ModelRef<T> {
  if (arguments.length === 1) {
    return obj => modelRefFromJson(fromObject, obj);
  }
  return json.union(
    obj => (typeof obj) as "string" | "object",
    {
      string: (obj) => obj as ModelRef<T>,
      object: (obj) => fromObject(obj as JsonObject)
    },
    obj
  );
}

