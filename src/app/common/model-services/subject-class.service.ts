import {Injectable} from '@angular/core';
import {ModelService, ModelServiceBackend} from '../model-base/model-service';
import {SubjectClass, SubjectClassParams} from '../model-types/subject-class';
import {ResponsePage} from '../model-base/pagination';
import {Observable} from 'rxjs';
import {Subject, SubjectIndex} from '../model-types/subject';
import {ModelParams} from '../model-base/model';
import {getModelRefId, ModelRef} from '../model-base/model-ref';
import {tap} from 'rxjs/operators';
import {JsonObject} from '../model-base/model-key-transform';


@Injectable({providedIn: 'root'})
export class SubjectClassService extends ModelService<SubjectClass> {
  constructor(backend: ModelServiceBackend) {
    super(backend, '/classes');
  }

  fromObject(obj: JsonObject) {
    return new SubjectClass(obj as any);
  }

  forYear(subject: ModelRef<Subject>, year: number): Observable<ResponsePage<SubjectClass>> {
    const params = {
      subject: getModelRefId(subject),
      year: `${year}`
    };
    return this.query('', { params });
  }
}
