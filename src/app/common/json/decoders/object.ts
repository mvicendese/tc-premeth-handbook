import {Decoder, isJsonObject, JsonObject, JsonObjectProperties} from '../types';
import {parseError, withContext} from '../context';

function object<T extends object>(properties: JsonObjectProperties<T>): Decoder<T>;
function object<T extends object>(properties: JsonObjectProperties<T>, json: unknown): T;
function object<T extends object>(properties: JsonObjectProperties<T>, json?: unknown): Decoder<T> | T {
  const decoder = (obj: unknown) => {
    if (!isJsonObject(obj)) {
      throw parseError(`Expected an object`);
    }
    return objectFromProperties(properties, obj);
  };

  if (isJsonObject(json)) {
    return decoder(json);
  } else {
    return decoder;
  }

}

function objectFromProperties<T extends object>(properties: JsonObjectProperties<T>, obj: JsonObject): T {
  const result = {};

  for (const key of Object.keys(properties)) {
    withContext(key, () => {
      const decoder = properties[key];
      if (typeof decoder === 'function') {
        result[key] = (decoder as Decoder<T>)(obj[key]);
      } else {
        result[key] = decoder;
      }
    });
  }
  return result as T;
}

export default object;
