import {Decoder, isJsonObject, JsonObject, JsonObjectProperties} from '../types';
import {enterContext, leaveContext, parseError, withContext} from '../context';


function object<T>(decodeProps: (obj: JsonObject) => T): Decoder<T>;
function object<T>(decodeProps: (obj: JsonObject) => T, json: unknown): T;

// tslint:disable:unified-signatures  max-line-length
function object<T extends JsonObject>(properties: JsonObjectProperties<T>): Decoder<T>;
function object<T extends JsonObject>(properties: JsonObjectProperties<T>, json: unknown): T;
// tslint:enable:unified-signatures max-line-length

function object<T>(
  decodePropsOrDecoders: any,
  json?: unknown,
): Decoder<T> | T {
  const decoder = (obj: unknown) => {
    if (!isJsonObject(obj)) {
      throw parseError(`Expected an object`);
    }

    const objProxy = new Proxy(obj, new PropertyContextHandler());

    let propDecoder = decodePropsOrDecoders;
    if (typeof decodePropsOrDecoders === 'function') {
      propDecoder = decodePropsOrDecoders;
    } else if (typeof propDecoder === 'object') {
      propDecoder = objectFromProperties(decodePropsOrDecoders);
    } else {
      throw new TypeError('Expected a decoder or object');
    }

    return propDecoder(objProxy);
  };

  try {
    if (isJsonObject(json)) {
      return decoder(json);
    } else {
      return decoder;
    }
  } finally {
    leaveContext();
  }
}

function objectFromProperties<T extends JsonObject>(properties: JsonObjectProperties<T>): (obj: JsonObject) => T {
  return (obj: JsonObject) => {
    const result = {};

    for (const objKey of Object.keys(obj)) {
      if (properties[objKey] === undefined) {
        throw parseError(`No decoder defined for property ${objKey}`);
      }
    }

    for (const key of Object.keys(properties)) {
      withContext(key, () => {
        const decoder = obj[key];
        if (typeof decoder === 'function') {
          result[key] = (decoder as Decoder<T>)(obj[key]);
        } else {
          result[key] = decoder;
        }
      });
    }
    return result as T;
  };
}

class PropertyContextHandler implements ProxyHandler<JsonObject> {
  get(target: JsonObject, key: PropertyKey, receiver: any) {
    if (typeof key !== 'string') {
      throw new Error(`Invalid key in json object. Json object keys must be strings.`);
    }
    enterContext(key);
    return Reflect.get(target, key, receiver);
  }
}

export default object;
