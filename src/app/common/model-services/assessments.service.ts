/* tslint:disable:curly */

import {v4 as uuid4} from 'uuid';

import {ModelService, ModelServiceBackend} from '../model-base/model-service';
import {Injectable} from '@angular/core';
import {ModelRef, modelRefId} from '../model-base/model-ref';
import {
  LessonOutcomeSelfAssessmentReport,
  lessonOutcomeSelfAssessmentReportFromJson,
  LessonPrelearningReport,
  lessonPrelearningReportFromJson,
  Report
} from '../model-types/assessment-reports';
import {Observable} from 'rxjs';
import {ResponsePage} from '../model-base/pagination';
import {LessonSchema, SubjectNode} from '../model-types/subjects';
import {
  Assessment,
  AssessmentType,
  blockAssessmentFromJson,
  LessonOutcomeSelfAssessment,
  LessonPrelearningAssessment,
  lessonPrelearningAssessmentFromJson
} from '../model-types/assessments';
import json, {JsonObject} from '../json';
import {Student, SubjectClass} from '../model-types/schools';
import {AnyAttempt, AssessmentAttempt, AssessmentAttemptType, CompletionBasedAssessmentAttempt,} from '../model-types/assessment-attempt';
import {map} from 'rxjs/operators';

export interface AssessmentQuery {
  student?: ModelRef<Student>[] | ModelRef<Student> | null;
  class?: ModelRef<SubjectClass> | null;
  node?: ModelRef<SubjectNode> | null;

  page?: number;
}

function assessmentQueryToParams(type: AssessmentType, query: AssessmentQuery): { [k: string]: string | string[] } {
  const params: { [k: string]: string | string[] } = { type };
  if (query.student) {
    if (Array.isArray(query.student)) {
      params.student = query.student.map(modelRefId).join('|');
    } else {
      params.student = modelRefId(query.student);
    }
  }
  if (query.class)
    params.class = modelRefId(query.class);
  if (query.node)
    params.node = modelRefId(query.node);
  if (query.page)
    params.page = query.page.toString();
  return params;
}


@Injectable({providedIn: 'root'})
export class AssessmentsService extends ModelService<Assessment> {

  fromJson(object: unknown): Assessment {
    return json.object<Assessment>((obj) => {
      switch (obj.type) {
        case 'block-assessment':
          return blockAssessmentFromJson(obj);
        case 'lesson-prelearning-assessment':
          return lessonPrelearningAssessmentFromJson(obj);
        case 'unit-assessment':
        // return new UnitAssessment(params);
        case 'lesson-outcome-self-assessment':
        // return lessonOutcomeSelfAssessmentFromJson(obj);
        default:
          throw new Error(`Unrecognised assessment type ${obj.type}`);
      }
    }, object);
  }

  reportFromJson(object: unknown): Report {
    return json.object<Report>((obj) => {
      switch (obj.assessmentType) {
        case 'lesson-prelearning-assessment':
          return lessonPrelearningReportFromJson(obj);
        case 'lesson-outcome-self-assessment':
          return lessonOutcomeSelfAssessmentReportFromJson(obj);
        default:
          throw new Error(`Unrecognised assessment type ${obj.assessmentType}`);
      }
    }, object);
  }

  constructor(backend: ModelServiceBackend) {
    super(backend, '/assessments');
  }

  fetchAssessment(assessmentType: 'lesson-prelearning-assessment', options: { params: { node: ModelRef<LessonSchema>, student: ModelRef<Student>} }): Observable<LessonPrelearningAssessment> {
    const params = assessmentQueryToParams(assessmentType, options.params);
    return this.queryUnique('', {params});
  }

  queryAssessments(assessmentType: 'lesson-prelearning-assessment', options: { params: AssessmentQuery }): Observable<ResponsePage<LessonPrelearningAssessment>>;
  queryAssessments(assessmentType: 'lesson-outcome-self-assessment', options: { params: AssessmentQuery }): Observable<ResponsePage<LessonOutcomeSelfAssessment>>;
  queryAssessments<T extends Assessment>(
      assessmentType: T['type'],
      options: { params: AssessmentQuery }
   ): Observable<ResponsePage<T>> {
    const params = assessmentQueryToParams(assessmentType, options.params);
    return this.query('', { params });
  }

  queryReports(assessmentType: 'lesson-prelearning-assessment',   options: { params: AssessmentQuery }): Observable<ResponsePage<LessonPrelearningReport>>;
  queryReports(assessmentType: 'lesson-outcome-self-assessment',  options: { params: AssessmentQuery }): Observable<ResponsePage<LessonOutcomeSelfAssessmentReport>>;
  queryReports<T extends Report>(
      assessmentType: T['assessmentType'],
      options: { params: AssessmentQuery }
  ): Observable<ResponsePage<T>> {
    const params = assessmentQueryToParams(assessmentType, options.params);
    return this.query('/reports', { params, useDecoder: this.reportFromJson.bind(this) });
  }

  saveAssessment(type: 'lesson-prelearning-assessment', options: Partial<LessonPrelearningAssessment>): Observable<LessonPrelearningAssessment>;
  saveAssessment(type: AssessmentType, options: Partial<Assessment>): Observable<Assessment> {
    const id = options.id || uuid4();

    const student = options.student;
    if (student == null) {
      throw new Error(`A 'student' is required`);
    }

    let node = options.node;
    if (node == null) {
      throw new Error(`A 'node' is required`);
    }

    return this.put(id, { type, id, student, node });
  }

  createAttempt(type: AssessmentType, attempt: Partial<CompletionBasedAssessmentAttempt>): Observable<CompletionBasedAssessmentAttempt>;
  createAttempt(type: AssessmentType, attempt: Partial<AssessmentAttempt>): Observable<AssessmentAttempt> {
    const assessment = attempt.assessment;
    if (assessment == null) {
      throw new Error('Assessment required');
    }

    let body: JsonObject;
    if (['lesson-prelearning-assessment'].includes(type)) {
      const completionState = (attempt as Partial<CompletionBasedAssessmentAttempt>).completionState;
      if (completionState == null) {
        throw new Error(`completionState required`);
      }

      body = CompletionBasedAssessmentAttempt.toJson({
        type: AssessmentAttemptType.fromAssessmentType(type),
        assessment,
        completionState,
      } as CompletionBasedAssessmentAttempt)
    } else {
      throw new Error(`Unexpected attempt type: ${attempt.type}`);
    }
    const assessmentId = modelRefId(attempt.assessment);
    return this.post<AssessmentAttempt>([assessmentId, 'attempt'].join('/'), body, {
      useDecoder: (item) => AnyAttempt.fromJson(item)
    });
  }
}



