import {Model} from './model';
import {Decoder, isJsonObject, JsonObject, parseError} from '../json';
import {Observable} from 'rxjs';


export type ModelRef<T extends Model> = string | Model | T;

export interface ModelResolver<T extends Model> {
  resolve(ref: ModelRef<T>): Observable<T>;
}

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
