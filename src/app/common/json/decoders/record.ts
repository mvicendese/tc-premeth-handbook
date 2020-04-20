import {Decoder, isJsonObject} from '../types';
import {parseError} from '../context';


export function record<V>(value: Decoder<V>): Decoder<Record<string, V>>;
export function record<V>(value: Decoder<V>, obj: unknown): Record<string, V>;
export function record<V>(value: Decoder<V>, obj?: unknown): Decoder<Record<string, V>> | Record<string, V> {
  if (arguments.length == 2) {
    if (isJsonObject(obj)) {
      return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [k, value(v)])
      );
    }
    throw parseError(`Expected a json object`);
  } else {
    return (obj) => record(value, obj);
  }
}


