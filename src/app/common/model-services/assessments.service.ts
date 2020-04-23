/* tslint:disable:curly */

import {v4 as uuid4} from 'uuid';

import {ModelService, ModelServiceBackend} from '../model-base/model-service';
import {Injectable} from '@angular/core';
import {ModelRef} from '../model-base/model-ref';
import {AnyReport} from '../model-types/assessment-reports';
import {Observable} from 'rxjs';
import {ResponsePage} from '../model-base/pagination';
import {LessonSchema, SubjectNode} from '../model-types/subjects';
import {AnyAssessment, Assessment, AssessmentType, LessonPrelearningAssessment,} from '../model-types/assessments';
import {JsonObject} from '../json';
import {Student, SubjectClass} from '../model-types/schools';
import {AnyAttempt, AssessmentAttempt, LessonPrelearningAssessmentAttempt} from '../model-types/assessment-attempt';
import {AnyProgress} from '../model-types/assessment-progress';

export interface AssessmentQuery {
  student?: ModelRef<Student>[] | ModelRef<Student> | null;
  subjectClass?: ModelRef<SubjectClass> | null;
  node?: ModelRef<SubjectNode> | null;

  page?: number;
}

function assessmentQueryToParams(type: AssessmentType, query: AssessmentQuery): { [k: string]: string | string[] } {
  const params: { [k: string]: string | string[] } = { type };
  if (query.student) {
    if (Array.isArray(query.student)) {
      params.student = query.student.map(ModelRef.id).join(',');
    } else {
      params.student = ModelRef.id(query.student);
    }
  }
  if (query.subjectClass)
    params.class = ModelRef.id(query.subjectClass);
  if (query.node)
    params.node = ModelRef.id(query.node);
  if (query.page)
    params.page = query.page.toString();
  return params;
}


@Injectable({providedIn: 'root'})
export class AssessmentsService extends ModelService<Assessment> {

  fromJson(object: unknown): AnyAssessment {
    return AnyAssessment.fromJson(object);
  }

  reportFromJson(object: unknown): AnyReport {
    return AnyReport.fromJson(object);
  }

  progressFromJson(object: unknown): AnyProgress {
    return AnyProgress.fromJson(object);
  }

  constructor(backend: ModelServiceBackend) {
    super(backend, '/assessments');
  }

  fetchAssessment(assessmentType: 'lesson-prelearning-assessment', options: { params: { node: ModelRef<LessonSchema>, student: ModelRef<Student>} }): Observable<LessonPrelearningAssessment | null> {
    const params = assessmentQueryToParams(assessmentType, options.params);
    return this.queryUnique('', {params});
  }

  queryAssessments<T extends Assessment>(assessmentType: T['type'], options: { params: AssessmentQuery }): Observable<ResponsePage<T>> {
    const params = assessmentQueryToParams(assessmentType, options.params);
    return this.query('', { params });
  }

  fetchReport<Report extends AnyReport>(assessmentType: Report['assessmentType'], options: { params: AssessmentQuery }): Observable<Report> {
    const params = assessmentQueryToParams(assessmentType, options.params);
    // A report is created on fetch, so one always exists, as long as the params are valid.
    return this.queryUnique('/reports', { params, useDecoder: this.reportFromJson.bind(this) }) as Observable<Report>;
  }

  queryReports<Report extends AnyReport>(
      assessmentType: Report['assessmentType'],
      options: { params: AssessmentQuery }
  ): Observable<ResponsePage<Report>> {
    const params = assessmentQueryToParams(assessmentType, options.params);
    return this.query('/reports', { params, useDecoder: this.reportFromJson.bind(this) });
  }

  fetchProgress<Progress extends AnyProgress>(
    assessmentType: Progress['assessmentType'],
    options: { params: AssessmentQuery }
  ): Observable<Progress | null> {
    const params = assessmentQueryToParams(assessmentType, options.params);
    return this.queryUnique('/progress', { params, useDecoder: this.progressFromJson.bind(this) });
  }

  queryProgresses<Progress  extends AnyProgress>(
      assessmentType: Progress['assessmentType'],
      options: { params: AssessmentQuery }
  ): Observable<ResponsePage<Progress>> {
    const params = assessmentQueryToParams(assessmentType, options.params);
    return this.query('/progress', { params, useDecoder: this.progressFromJson.bind(this) });
  }

  saveAssessment(type: AssessmentType, options: Partial<Assessment>): Observable<Assessment> {
    const id = options.id || uuid4();

    const student = ModelRef.id(options.student);
    if (student == null) {
      throw new Error(`A 'student' is required`);
    }

    const subjectNode = ModelRef.id(options.subjectNode);
    if (subjectNode == null) {
      throw new Error(`A 'subjectNode' is required`);
    }

    return this.put(id, { type, id, student, subjectNode });
  }

  createAttempt(type: AssessmentType, attempt: Partial<AssessmentAttempt>): Observable<AssessmentAttempt> {
    const assessment = attempt.assessment;
    if (assessment == null) {
      throw new Error('Assessment required');
    }

    let body: JsonObject;
    if (['lesson-prelearning-assessment'].includes(type)) {
      const completionState = (attempt as Partial<LessonPrelearningAssessmentAttempt>).completionState;
      if (completionState == null) {
        throw new Error(`completionState required`);
      }

      body = LessonPrelearningAssessmentAttempt.toJson({
        assessmentType: type,
        assessment,
        completionState,
      })
    } else {
      throw new Error(`Unexpected attempt type: ${attempt.assessmentType}`);
    }
    const assessmentId = ModelRef.id(attempt.assessment);
    return this.post<AssessmentAttempt>([assessmentId, 'attempt'].join('/'), body, {
      useDecoder: (item) => AnyAttempt.fromJson(item)
    });
  }
}



