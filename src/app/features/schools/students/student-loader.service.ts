import {Injectable, Provider, Type} from '@angular/core';
import {_ModelLoader, ModelLoader} from '../../../common/model-api-context/model-loader';
import {Student} from '../../../common/model-types/schools';
import {StudentModelApiService} from '../../../common/model-services/schools.service';
import {providePersonTypeLoader} from '../../base/person/person-loader.service';
import {Person} from '../../base/person/person.model';


@Injectable()
export class StudentLoader extends _ModelLoader<Student> {
  readonly type = 'student';

  constructor(
    readonly students: StudentModelApiService
  ) {
    super(students);
  }
}

export function provideStudentLoader(): Provider[] {
  return [
    StudentLoader,
    providePersonTypeLoader('student', StudentLoader as Type<ModelLoader<Person>>)
  ];
}

