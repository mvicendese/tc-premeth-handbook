import {Model} from './model';
import {Decoder, isJsonObject, JsonObject, parseError} from '../json';
import {Observable} from 'rxjs';


export type ModelRef<T extends Model> = string | Model | T;

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
 *    myProp: Model | SomeModel;
 *  }
 *
 *  Note that due to the partial nature of ModelRef, it is not possible for `Resolve` to
 *  eliminate the `| Model` part of the declaration.
 */
export type Resolve<T extends Model, K extends keyof T> = {
  [K1 in keyof T]: K1 extends K ? Exclude<T[K1], string> : T[K1];
};

export function isRefId(ref: unknown): ref is string {
  return typeof ref === 'string';
}
export function isRefModel<T extends Model>(ref: ModelRef<T> | null): ref is T {
  return isJsonObject(ref);
}

export function modelRefId(ref: ModelRef<any>): string {
  if (isRefId(ref)) {
    return ref;
  } else {
    return ref.id;
  }
}

export function modelRefFromJson<T extends Model>(fromObject: (obj: JsonObject) => T): Decoder<ModelRef<T>>;
export function modelRefFromJson<T extends Model>(fromObject: (obj: JsonObject) => T, ref: ModelRef<T>): ModelRef<T>;
export function modelRefFromJson<T extends Model>(fromObject: (obj: JsonObject) => T, ref?: ModelRef<T>): Decoder<ModelRef<T>> | ModelRef<T> {
  const decoder = (obj: unknown) => {
    if (typeof obj === 'string') {
      return obj;
    } else if (isJsonObject(obj)) {
      return fromObject(obj);
    }
    throw parseError(`Expected a model ref`);
  };

  if (ref === undefined) {
    return decoder;
  } else {
    return decoder(ref);
  }
}

export function unresolvedModelRefError(propName: string) {
  return new Error(`Unresolved model reference ${propName}`);
}
