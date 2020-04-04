
import {Injectable} from '@angular/core';
import {ModelService, ModelServiceBackend} from '../model-base/model-service';
import {BehaviorSubject, defer, EMPTY, merge, NEVER, Observable, of, race, timer, Unsubscribable} from 'rxjs';
import {map, mapTo, switchMap, switchMapTo, tap} from 'rxjs/operators';
import {modelRefId, ModelRef} from '../model-base/model-ref';
import {ResponsePage} from '../model-base/pagination';
import {Student} from '../model-types/schools';

@Injectable({providedIn: 'root'})
export class StudentService extends ModelService<Student> {
  readonly fromJson = Student.fromJson;

  constructor(
    backend: ModelServiceBackend
  ) {
    super(backend, '/students');
  }

  /**
   * Query students.
   * @param params
   */
  students(params: {class?: string | string[], student?: string | string[]}): Observable<ResponsePage<Student>> {
    Object.keys(params).forEach(k => params[k] === undefined && delete params[k]);
    return this.query('', {params});
  }
}
