import {PersonParams} from './person';
import {Model, ModelParams} from '../model-base/model';
import {Student, StudentParams} from './student';
import {Teacher, TeacherParams} from './teacher';


export interface UserParams extends ModelParams {
  readonly person: TeacherParams | StudentParams;
}

export class User extends Model implements UserParams {
  readonly type = 'user';
  readonly person: Teacher | Student;

  constructor(readonly params: UserParams) {
    super(params);
    switch (params.person.type) {
      case 'student':
        this.person = new Student(params.person);
        break;
      case 'teacher':
        this.person = new Teacher(params.person);
        break;
      default:
        throw new Error('Invalid person in user object');
    }
  }

  get isTeacher() {
    return this.person instanceof Teacher;
  }

  get isStudent() {
    return this.person instanceof Student;
  }
}
