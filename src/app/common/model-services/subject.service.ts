import {Injectable} from '@angular/core';
import {ModelService, ModelServiceBackend} from '../model-base/model-service';
import {ModelParams} from '../model-base/model';
import {BehaviorSubject, Observable} from 'rxjs';
import {ResponsePage} from '../model-base/pagination';
import {SubjectClass} from '../model-types/subject-class';
import {Subject, SubjectIndex, SubjectParams} from '../model-types/subject';
import {JsonObject} from '../model-base/model-key-transform';



@Injectable({providedIn: 'root'})
export class SubjectService extends ModelService<Subject> {
  readonly type = 'subject';
  readonly path = '/subjects';

  constructor(backend: ModelServiceBackend) {
    super(backend, '/subjects');
  }

  fromObject(obj: JsonObject) {
    return new Subject(obj as any);
  }

  index(params?: {search: string}) {
    return this.query('', {params, useDecoder: (modelParams) => modelParams as any as SubjectIndex});
  }
}
