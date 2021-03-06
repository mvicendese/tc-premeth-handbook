import {Model} from './model';
import json, {Decoder, isJsonObject, parseError} from '../json';
import {isModelEnum, ModelEnum} from './model-meta';

export interface Id<T extends Model> {
  readonly type: T['type'] | ModelEnum<T['type']>;
  readonly id: string;
}

export type Ref<T extends Model> = Id<T> | T;

export function ref<T extends Model>(type: T['type'], id: string): Ref<T> {
  return {type, id};
}

export function isRef(obj: unknown): obj is Ref<any> {
  if (isJsonObject(obj)) {
    return (typeof obj.type === 'string' || isModelEnum(obj.type))
      && typeof obj.id === 'string';
  }
  return false;
}

export function isRefModel<T extends Model>(obj: Ref<T>): obj is T {
  return isRef(obj) && Object.keys(obj).some(k => k !== 'type' && k !== 'id');
}

// FIXME: Remove this in favour of refFromJson2.
//        For the moment, the server still thinks most references are string | T.
export function refFromJson<T extends Model>(type: T['type'] | ModelEnum<T['type']>, modelFromJson?: Decoder<T>): Decoder<Ref<T>>;
export function refFromJson<T extends Model>(type: T['type'] | ModelEnum<T['type']>, modelFromJson: Decoder<T>, obj: unknown): Ref<T>;

export function refFromJson<T extends Model>(
  type: T['type'] | ModelEnum<T['type']>,
  modelFromJson?: Decoder<T>, obj?: unknown
): Ref<T> | Decoder<Ref<T>> {
  if (arguments.length > 2) {
    if (typeof obj === 'string') {
      return {type, id: obj};
    } else {
      if (modelFromJson === undefined) {
        throw parseError('modelFromJson must be provided if the server can return objects for this property');
      }
      return modelFromJson(obj);
    }
  }
  if (modelFromJson === undefined) {
    throw new Error('modelFromJson must be provided if calling with object');
  }
  return (o: unknown) => refFromJson(type, modelFromJson, o);
}





