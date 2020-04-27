import {Decoder, isJsonObject} from '../types';
import {parseError} from '../context';


export function record<K extends string, V>(value: Decoder<V>): Decoder<Record<K, V>>;
export function record<K extends string, V>(value: Decoder<V>, obj: unknown): Record<K, V>;

export function record<K extends string, V>(value: Decoder<V>, obj?: unknown): Decoder<Record<K, V>> | Record<K, V> {
  if (arguments.length === 2) {
    if (isJsonObject(obj)) {
      return Object.fromEntries<any>(
        Object.entries(obj).map(([k, v]) => [k, value(v)])
      ) as Record<K, V>;
    }
    throw parseError(`Expected a json object`);
  } else {
    return (object) => record(value, object);
  }
}


