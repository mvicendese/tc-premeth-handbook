import json, {isJsonObject, JsonObject, parseError} from '../json';
import {BaseModel, Model, modelProperties} from '../model-base/model';
import {Student, Teacher} from './schools';
import {modelRefFromJson} from '../model-base/model-ref';

export interface Person extends Model {
  readonly type: 'student' | 'teacher';
  readonly id: string;
  readonly name: string;
}

function personFromJson(object: unknown): Person {
  let type: string;
  if (isJsonObject(object)) {
    type = json.string(object.type);
    if (!['student', 'teacher'].includes(type)) {
      throw parseError(`Unexpected model type for Person '${type}`);
    }
  }

  return json.object<Person>({
    ...modelProperties(type),
    name: json.string
  }, object);
}

export interface UserParams extends Model {
  readonly person: Person;
}

function userParamsFromJson(obj: unknown): UserParams {
  return json.object<UserParams>({
    ...modelProperties('user'),
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
