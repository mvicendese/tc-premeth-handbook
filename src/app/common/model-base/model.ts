import {v4 as uuid4} from 'uuid';
import json, {JsonObject} from '../json';

export interface Model {
  readonly type: string;
  readonly id: string;

  readonly createdAt: Date | null;
  readonly updatedAt: Date | null;
}

export abstract class BaseModel implements Model {
  readonly type: string;
  readonly id: string;

  readonly createdAt: Date | null;
  readonly updatedAt: Date | null;

  protected constructor(readonly params: Model) {
    this.type = params.type;
    this.id = params.id;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }
}

export function modelProperties<T extends Model>(type: T['type']) {
  return {
    type: { value: type },
    id: json.string,
    createdAt: json.date,
    updatedAt: json.nullable(json.date)
  };
}
export function createModel<T extends Model>(type: T['type']) {
  return { type, id: uuid4() };
}



