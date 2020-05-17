import {Model} from '../../../common/model-base/model';
import {modelMeta} from '../../../common/model-base/model-meta';
import json from '../../../common/json';


export interface Person extends Model {

  readonly school: string;

  readonly firstName: string;
  readonly surname: string;
  readonly fullName: string;

  readonly email: string;
  readonly avatarHref: string | null;
}

export const Person = modelMeta<Person>({
  create() {
    throw new Error('not implemented');
  },
  properties: {
    ...Model.properties,
    school: json.string,
    firstName: json.string,
    surname: json.string,
    fullName: json.string,
    email: json.string,
    avatarHref: json.nullable(json.string)
  }
});
