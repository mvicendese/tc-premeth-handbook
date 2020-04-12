import {InjectionToken, Provider} from '@angular/core';
import {camelCase, snakeCase} from 'change-case';
import {isJsonObject, JsonObject, parseError} from '../json';

export function transformKeys(obj: JsonObject, transform: (k: string) => string) {
  if (obj == null) {
    throw parseError(`Cannot transform keys of null or undefined object`);
  }

  return _transformKeys(obj, transform, new WeakSet<JsonObject>());
}

function _transformKeys(obj: JsonObject, transform: (k: string) => string, seen: WeakSet<JsonObject>) {
  seen.add(obj);

  const result: JsonObject = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (Array.isArray(v)) {
      v = v.map(item => isJsonObject(item) ? _transformKeys(item, transform, seen) : item);
    } else if (isJsonObject(v)) {
      if (seen.has(v)) {
        throw new Error(`Transforming keys of circular structure`);
      }  else {
        v = _transformKeys(v as { [k: string]: unknown }, transform, seen);
      }
    }
    result[transform(k)] = v;
  });
  return result;
}

export const toLowerCamelCase = (k: string) => camelCase(k);
export const toUnderscoreCase = (k: string) => snakeCase(k, {delimiter: '_'});

