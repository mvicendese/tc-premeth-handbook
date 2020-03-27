import {InjectionToken, Provider} from '@angular/core';
import {camelCase} from 'change-case';

export interface JsonObject {
  [k: string]: unknown;
}
export function isJsonObject(obj: unknown): obj is JsonObject {
  return typeof obj === 'object'
      && !Array.isArray(obj)
      && obj != null;
}

export function transformKeys(obj: JsonObject): JsonObject {
  const result: JsonObject = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (Array.isArray(v)) {
      v = v.map(item => transformKeys(item));
    } else if (isJsonObject(v)) {
      v = transformKeys(v as {[k: string]: unknown});
    }

    result[camelCase(k)] = v;
  });
  return result;
}

