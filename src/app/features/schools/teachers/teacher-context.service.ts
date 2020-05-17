import {Injectable, Provider, Type} from '@angular/core';
import {Teacher} from '../../../common/model-types/schools';
import {TeacherModelApiService} from '../../../common/model-services/schools.service';
import {_ModelLoader, ModelLoader} from '../../../common/model-api-context/model-loader';
import {providePersonTypeLoader} from '../../base/person/person-loader.service';
import {Person} from '../../base/person/person.model';

@Injectable()
export class TeacherLoader extends _ModelLoader<Teacher> {
  constructor(readonly teachers: TeacherModelApiService) {
    super(teachers);
  }
}

export function provideTeacherLoader(): Provider[] {
  return [
    TeacherLoader,
    providePersonTypeLoader('teacher', TeacherLoader as Type<ModelLoader<Person>>)
  ]
}

