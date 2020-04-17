
export interface JsonObject {
  [k: string]: unknown;
}
export function isJsonObject(obj: unknown): obj is JsonObject {
  return obj != null && typeof obj === 'object' && !Array.isArray(obj);
}

export type JsonObjectProperty<T, K extends keyof T> = TypedPropertyDescriptor<T[K]> | Decoder<T[K]>;

export type JsonObjectProperties<T> = {
  [K1 in keyof T]?: JsonObjectProperty<T, K1>;
};

export type JsonArray  = unknown[];
export function isJsonArray(obj: unknown): obj is JsonArray {
  return Array.isArray(obj);
}

export type Decoder<T> =  (obj: unknown) => T;

