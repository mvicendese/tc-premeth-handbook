import {Injectable} from '@angular/core';
import {ModelService, ModelServiceBackend} from '../model-base/model-service';
import {Subject, subjectIndexFromJson} from '../model-types/subjects';


@Injectable({providedIn: 'root'})
export class SubjectsService extends ModelService<Subject> {
  readonly fromJson = Subject.fromJson;

  constructor(backend: ModelServiceBackend) {
    super(backend, '/subjects');
  }

  index(params: {search: string} = {search: ''}) {
    return this.query('', {params, useDecoder: subjectIndexFromJson });
  }
}
