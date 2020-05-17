import {Injectable} from '@angular/core';
import {Subject, subjectIndexFromJson} from '../model-types/subjects';
import {AbstractModelApiService} from '../model-api/abstract-model-api-service';
import {ApiBackend} from '../model-api/api-backend';
import {Observable} from 'rxjs';


@Injectable({providedIn: 'root'})
export class SubjectsModelApiService extends AbstractModelApiService<Subject> {
  fromJson<U extends Subject>(object: unknown) {
    return Subject.fromJson(object) as U;
  }

  constructor(backend: ApiBackend) {
    super(backend, ['/subjects']);
  }

  index(params: {search: string} = {search: ''}) {
    return this.query([], {params, itemDecoder: subjectIndexFromJson });
  }

  getSubject(name: string): Observable<Subject> {
    return this.queryUnique([], {params: {name}, decoder: Subject.fromJson});
  }

}
