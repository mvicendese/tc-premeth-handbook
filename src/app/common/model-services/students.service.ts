import {Injectable} from '@angular/core';
import {ModelService, ModelServiceBackend} from '../model-base/model-service';
import {Observable} from 'rxjs';
import {ResponsePage} from '../model-base/pagination';
import {Student} from '../model-types/schools';

@Injectable({providedIn: 'root'})
export class StudentService extends ModelService<Student> {
  readonly fromJson = Student.fromJson;

  constructor(
    backend: ModelServiceBackend
  ) {
    super(backend, '/schools');
  }

  /**
   * Query schools.
   * @param options
   */
  students(options: {class?: string | string[], student?: string | string[]}): Observable<ResponsePage<Student>> {
    const params: {[k: string]: string | string[] } = {};
    if (options.class) {
      params.class = options.class;
    }
    if (options.student) {
      params.student = options.student;
    }

    Object.keys(params).forEach(k => params[k] === undefined && delete params[k]);
    return this.query('', {params});
  }
}
