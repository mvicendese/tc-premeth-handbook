/* tslint:disable:curly */
import {ModelService, ModelServiceBackend} from '../model-base/model-service';
import {Injectable} from '@angular/core';
import {ModelRef, modelRefId} from '../model-base/model-ref';
import {
  LessonOutcomeSelfAssessmentReport, lessonOutcomeSelfAssessmentReportFromJson,
  LessonPrelearningReport,
  lessonPrelearningReportFromJson,
  Report
} from '../model-types/assessment-reports';
import {Observable} from 'rxjs';
import {ResponsePage} from '../model-base/pagination';
import {Block, LessonOutcome, LessonSchema, Subject, SubjectNode, Unit} from '../model-types/subjects';
import {
  Assessment,
  AssessmentType,
  BlockAssessment,
  blockAssessmentFromJson, LessonOutcomeSelfAssessment,
  LessonPrelearningAssessment, lessonPrelearningAssessmentFromJson
} from '../model-types/assessments';
import json, {JsonObject} from '../json';
import {AssessmentAttempt} from '../model-types/assessment-attempt';
import {Student, SubjectClass} from '../model-types/schools';

export interface AssessmentQuery {
  student?: ModelRef<Student> | null;
  class?: ModelRef<SubjectClass> | null;
  node?: ModelRef<SubjectNode> | null;

  page?: number;
}

function assessmentQueryToParams(type: AssessmentType, query: AssessmentQuery): { [k: string]: string | string[] } {
  const params: { [k: string]: string | string[] } = { type };
  if (query.student)
    params.student = modelRefId(query.student);
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
  queryAssessments(assessmentType: AssessmentType, options: { params: AssessmentQuery }) {
    const params = assessmentQueryToParams(assessmentType, options.params);
    return this.query('', { params });
  }

  queryReports(assessmentType: 'lesson-prelearning-assessment',   options: { params: AssessmentQuery }): Observable<ResponsePage<LessonPrelearningReport>>;
  queryReports(assessmentType: 'lesson-outcome-self-assessment',  options: { params: AssessmentQuery }): Observable<ResponsePage<LessonOutcomeSelfAssessmentReport>>;
  queryReports(assessmentType: AssessmentType,                    options: { params: AssessmentQuery }): Observable<ResponsePage<Report>> {
    const params = assessmentQueryToParams(assessmentType, options.params);
    return this.query('/reports', { params, useDecoder: this.reportFromJson.bind(this) });
  }

  createAttempt(type: string, attempt: {assessment: ModelRef<Assessment>} & JsonObject) {
    const assessmentId = modelRefId(attempt.assessment);
    return this.backend.post([assessmentId, 'create_attempt'].join('/'), {
      body: {type, ...attempt}
    });
  }

  markPrelearningAssessmentComplete(assessment: ModelRef<LessonPrelearningAssessment>, isCompleted: boolean) {
    return this.createAttempt('lesson-prelearning-assessment-attempt', {assessment, isCompleted});
  }
}



