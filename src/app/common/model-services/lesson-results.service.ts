import {ModelService, ModelServiceBackend} from '../model-base/model-service';
import {LessonResult, LessonResultParams} from '../model-types/lesson-result';
import {Student} from '../model-types/student';
import {LessonSchema} from '../model-types/lesson-schema';
import {Observable} from 'rxjs';
import {getModelRefId, ModelRef} from '../model-base/model-ref';
import {ModelParams} from '../model-base/model';
import {Injectable} from '@angular/core';


@Injectable({providedIn: 'root'})
export class LessonResultsService extends ModelService<LessonResult> {
  fromObject(obj) {
    return new LessonResult(obj as LessonResultParams);
  }

  constructor(backend: ModelServiceBackend) {
    super(backend, '/lesson_results');
  }

  forStudentLesson(student: ModelRef<Student>, lesson: ModelRef<LessonSchema>): Observable<LessonResult> {
    return this.queryUnique('', {
      params: {
        student: getModelRefId(student),
        lesson: getModelRefId(lesson)
      }
    });
  }
}
