
export interface JsonObject {
  [k: string]: unknown;
}
export function isJsonObject(obj: unknown): obj is JsonObject {
  return obj != null && typeof obj === 'object' && !Array.isArray(obj);
}

export type JsonObjectKeys<T extends JsonObject> = Extract<keyof T, string>;
export type JsonObjectProperty<T, K extends keyof T> = Decoder<K> | T[K];

export type JsonObjectProperties<T extends JsonObject> = {
  [K1 in JsonObjectKeys<T>]: JsonObjectProperty<T, K1>;
};

export type JsonArray  = unknown[];
export function isJsonArray(obj: unknown): obj is JsonArray {
  return Array.isArray(obj);
}

export type Decoder<T> =  (obj: unknown) => T;

