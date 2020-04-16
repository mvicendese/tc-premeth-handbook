
import json from '../json';


export interface ModelDocument {
  readonly id: string;
  readonly generation: number;
  readonly generatedAt: Date;
}

export const ModelDocument = {
  properties: {
    id: json.string,
    generation: json.number,
    generatedAt: json.date
  },
  fromJson: (obj: unknown) => json.object(ModelDocument.properties, obj)
};

