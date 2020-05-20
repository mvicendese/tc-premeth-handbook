import {Model} from './model';
import {ModelDocument} from './document';
import json, {JsonObjectProperties, JsonObjectProperty} from '../json';
import {Observable} from 'rxjs';

export interface ModelEnum<T extends string> {
  readonly values: ReadonlyArray<T>;

  is(obj: unknown): obj is T;

  fromJson(obj: unknown): T;
}

export function isModelEnum(obj: unknown): obj is ModelEnum<any> {
  if (typeof obj === 'object' && obj !== null) {
    const {values} = obj as any;
    return Array.isArray(values) && values.every(item => typeof item === 'string');
  }
  return false;
}

export function modelEnum<T extends string>(params: {
  name: string,
  values: ReadonlyArray<T>
}): ModelEnum<T> {
  function isEnumValue(obj: unknown): obj is T {
    return typeof obj === 'string' && params.values.includes(obj as any);
  }

  return {
    values: params.values,
    is: isEnumValue,

    fromJson(obj: unknown): T {
      if (isEnumValue(obj)) {
        return obj;
      }
      throw new Error(`Expected a ${params.name} value (one of '${params.values.join('\', \'')}'`);
    }
  };
}

export interface ModelMeta<T extends Model> {
  readonly properties: { [K in keyof T]: JsonObjectProperty<T, K> };

  fromJson(obj: unknown): T;
  create: (args: Partial<T>) => T;
}

export function modelMeta<T extends Model>(params: {
  properties: { [K in keyof T]: JsonObjectProperty<T, K>};
  create: (args: Partial<T>) => T;
  fromJson?: (obj: unknown) => T;
}): ModelMeta<T> {
  return {
    properties: params.properties,
    create: params.create,
    fromJson: params.fromJson || json.object<T>(params.properties)
  };
}

export interface ModelDocumentMetaOptions<T extends ModelDocument> {
  readonly properties: JsonObjectProperties<T>;
}

export interface ModelDocumentMeta<T extends ModelDocument> {
  readonly properties: JsonObjectProperties<T>;
  fromJson(obj: unknown): T;
}

export function modelDocumentMeta<T extends ModelDocument>(
  params: ModelDocumentMetaOptions<T>
): ModelDocumentMeta<T> {
  return {
    properties: params.properties,
    fromJson: json.object<T>(params.properties as JsonObjectProperties<T>)
  };
}

