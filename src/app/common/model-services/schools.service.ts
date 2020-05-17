import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {Student, SubjectClass, Teacher} from '../model-types/schools';
import {Subject} from '../model-types/subjects';
import {AbstractModelApiService} from '../model-api/abstract-model-api-service';
import {ApiBackend} from '../model-api/api-backend';
import {ResponsePage} from '../model-api/response-page';
import {Ref} from '../model-base/ref';

@Injectable({providedIn: 'root'})
export class StudentModelApiService extends AbstractModelApiService<Student> {
  fromJson<U extends Student>(obj: unknown) { return Student.fromJson(obj) as U; }

  constructor(
    backend: ApiBackend
  ) {
    super(backend, ['/schools', 'students']);
  }

  /**
   * Query schools.
   * @param options
   */
  students(options: {class?: string | string[], student?: string | string[]}): Observable<ResponsePage<Student>> {
    const params: {[k: string]: string | readonly string[] } = {};
    if (options.class) {
      params.class = options.class;
    }
    if (options.student) {
      params.student = options.student;
    }

    Object.keys(params).forEach(k => params[k] === undefined && delete params[k]);
    return this.query([], {params, itemDecoder: this.fromJson});
  }
}

@Injectable({providedIn: 'root'})
export class TeacherModelApiService extends AbstractModelApiService<Teacher> {
  readonly fromJson = Teacher.fromJson;

  constructor(
    backend: ApiBackend
  ) {
    super(backend, ['/schools', 'teachers'])
  }
}


@Injectable({providedIn: 'root'})
export class SubjectClassModelApiService extends AbstractModelApiService<SubjectClass> {
  fromJson<U extends SubjectClass>(obj: unknown): U {
    return SubjectClass.fromJson(obj) as U;
  }

  constructor(backend: ApiBackend) {
    super(backend, ['/schools', 'classes']);
  }

  forYear(subject: Ref<Subject>, year: number): Observable<ResponsePage<SubjectClass>> {
    const params = {
      subject: subject.id,
      year: `${year}`
    };
    return this.query([], { params, itemDecoder: SubjectClass.fromJson });
  }
}
