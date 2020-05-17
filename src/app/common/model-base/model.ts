import {v4 as uuid4} from 'uuid';
import json, {JsonObject, JsonObjectProperties} from '../json';
import {modelMeta} from './model-meta';

export interface Model {
  readonly isModel: true;
  readonly type: string;
  readonly id: string;

  readonly createdAt: Date | null;
  readonly updatedAt: Date | null;
}

export abstract class BaseModel implements Model {
  readonly isModel = true;

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

export const Model = modelMeta<Model>({
  properties: {
    isModel: { value: true, enumerable: true },
    type: json.string,
    id: json.string,
    createdAt: json.date,
    updatedAt: json.nullable(json.date)
  },

  create(args: Partial<Model>): Model {
    const type = args.type;
    if (type == null) {
      throw new Error(`A 'type' is required`);
    }
    return {
      isModel: true,
      type,
      id: uuid4(),
      createdAt: null,
      updatedAt: null
    };
  }
});



