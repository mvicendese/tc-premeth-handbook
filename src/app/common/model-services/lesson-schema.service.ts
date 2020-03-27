import {Injectable} from '@angular/core';
import {ModelService, ModelServiceBackend} from '../model-base/model-service';
import {LessonSchema, LessonSchemaParams} from '../model-types/lesson-schema';
import {JsonObject} from '../model-base/model-key-transform';

@Injectable({providedIn: 'root'})
export class LessonSchemaService extends ModelService<LessonSchema> {
  constructor(backend: ModelServiceBackend) {
    super(backend, '/lessons');
  }

  fromObject(obj: JsonObject) {
    return new LessonSchema(obj as any);
  }
}
