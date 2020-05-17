import json, {isJsonObject} from '../../../common/json';
import {Model} from '../../../common/model-base/model';
import {modelMeta} from '../../../common/model-base/model-meta';
import {Person} from '../person/person.model';


export interface User extends Model {
  readonly type: 'user';
  readonly userType: string;

  readonly isTeacher: boolean;
  readonly isStudent: boolean;

  readonly person: Person;
}

export const User = modelMeta<User>({
  create: () => { throw new Error('not implemented'); },
  properties: {
    ...Model.properties,
    type: { value: 'user'},
    userType: {
      get() {
        return this.person.type;
      }
    },
    isTeacher: {
      get() {
        return this.userType === 'teacher'; }
    },
    isStudent: {
      get() { return this.userType === 'student'; }
    },
    person: Person.fromJson
  }
});
