import json, {isJsonObject, JsonObject, parseError} from '../json';
import {BaseModel, Model} from '../model-base/model';
import {Student, Teacher} from './schools';
import {modelEnum} from '../model-base/model-meta';

export type PersonType = 'student' | 'teacher';
export const PersonType = modelEnum<PersonType>({
  name: 'PersonType',
  values: ['student', 'teacher']
});


export interface Person extends Model {
  readonly type: 'student' | 'teacher';
  readonly id: string;
  readonly name: string;
}

function personFromJson(object: unknown): Person {
  return json.object<Person>({
    ...Model.properties,
    type: PersonType.fromJson,
    name: json.string
  }, object);
}

export interface UserParams extends Model {
  readonly person: Person;
}

function userParamsFromJson(obj: unknown): UserParams {
  return json.object<UserParams>({
    ...Model.properties,
    person: personFromJson,
  }, obj);
}

export class User extends BaseModel implements UserParams {
  static fromJson(obj: unknown): User {
    const params = userParamsFromJson(obj);
    return new User(params);
  }

  readonly person: Person;

  constructor(readonly params: UserParams) {
    super(params);
    this.person = params.person;
 }

  get isTeacher() {
    return this.person.type === 'teacher';
  }

  get isStudent() {
    return this.person.type === 'student';
  }
}
