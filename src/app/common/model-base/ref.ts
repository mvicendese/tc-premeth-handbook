import {Model} from './model';
import json, {Decoder, isJsonObject, parseError} from '../json';


export interface Id<T extends Model> {
  readonly isModel?: boolean;
  readonly type: T['type'];
  readonly id: string;
}

export type Ref<T extends Model> = Id<T> | T;

export function ref<T extends Model>(type: T['type'], id: string): Ref<T> {
  return {type, id};
}

export function isRef(obj: unknown): obj is Ref<any> {
  return isJsonObject(obj) && typeof obj.type === 'string' && typeof obj.id === 'string';
}

export function isRefModel<T extends Model>(obj: Ref<T>): obj is T {
  return obj.isModel as boolean;
}

export function refFromJson<T extends Model>(typeOrSubtype: string, modelFromJson?: Decoder<T>): Decoder<Ref<T>>;
export function refFromJson<T extends Model>(typeOrSubtype: string, modelFromJson: Decoder<T>, obj: unknown): Ref<T>;

export function refFromJson<T extends Model>(type: string, modelFromJson?: Decoder<T>, obj?: unknown): Ref<T> | Decoder<Ref<T>> {
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





