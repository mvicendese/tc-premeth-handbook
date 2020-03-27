import {Model, ModelProjection} from './model';


export type ModelRef<T extends Model> = string | ModelProjection<T>;

export function isModelRefId(ref: unknown): ref is string {
  return typeof ref === 'string';
}

export function getModelRefId(ref: ModelRef<any>): string {
  if (isModelRefId(ref)) {
    return ref;
  } else {
    return ref.id;
  }
}

export function unresolvedModelRefError(propName: string) {
  return new Error(`Unresolved model reference ${propName}`);
}
