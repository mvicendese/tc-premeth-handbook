import {InjectionToken, Provider} from '@angular/core';
import {camelCase, snakeCase} from 'change-case';
import {isJsonObject, JsonObject} from '../json';

export function transformKeys(obj: JsonObject, transform: (k: string) => string): JsonObject {
  const result: JsonObject = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (Array.isArray(v)) {
      v = v.map(item => isJsonObject(item) ? transformKeys(item, transform) : item);
    } else if (isJsonObject(v)) {
      v = transformKeys(v as {[k: string]: unknown}, transform);
    }

    result[transform(k)] = v;
  });
  return result;
}

export const toLowerCamelCase = (k: string) => camelCase(k);
export const toUnderscoreCase = (k: string) => snakeCase(k, {delimiter: '_'});

