import {Injectable} from '@angular/core';
import {ModelService, ModelServiceBackend} from '../model-base/model-service';
import {ResponsePage} from '../model-base/pagination';
import {Observable} from 'rxjs';
import {modelRefId, ModelRef} from '../model-base/model-ref';
import {SubjectClass, subjectClassFromJson} from '../model-types/schools';
import {Subject} from '../model-types/subjects';


@Injectable({providedIn: 'root'})
export class SubjectClassService extends ModelService<SubjectClass> {
  readonly fromJson = subjectClassFromJson;

  constructor(backend: ModelServiceBackend) {
    super(backend, '/classes');
  }

  forYear(subject: ModelRef<Subject>, year: number): Observable<ResponsePage<SubjectClass>> {
    const params = {
      subject: modelRefId(subject),
      year: `${year}`
    };
    return this.query('', { params });
  }
}
