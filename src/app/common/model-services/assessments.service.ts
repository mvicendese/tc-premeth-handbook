import {ModelService, ModelServiceBackend} from '../model-base/model-service';
import {Injectable} from '@angular/core';
import {ModelRef, modelRefId} from '../model-base/model-ref';
import {
  LessonOutcomeSelfAssessmentReport,
  LessonPrelearningReport,
  lessonPrelearningReportFromJson,
  Report
} from '../model-types/assessment-reports';
import {Observable} from 'rxjs';
import {ResponsePage} from '../model-base/pagination';
import {SubjectNode} from '../model-types/subjects';
import {
  Assessment,
  AssessmentType,
  BlockAssessment,
  blockAssessmentFromJson,
  LessonPrelearningAssessment, lessonPrelearningAssessmentFromJson
} from '../model-types/assessments';
import json, {JsonObject} from '../json';
import {AssessmentAttempt} from '../model-types/assessment-attempt';

export interface AssessmentQuery {
  student?: string | string[];
  class?: string | string[];

  node?: ModelRef<SubjectNode>;
}

function toParams(type: string, query: AssessmentQuery): { [k: string]: string | string[] } {
  const params = {
    type,
    ...query,
    node: query.node && modelRefId(query.node)
  };
  Object.entries(params)
    .filter(([k, v]) => v === undefined)
    .forEach(([k]) => delete params[k]);
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
        default:
          throw new Error(`Unrecognised assessment type ${obj.assessmentType}`);
      }
    }, object);
  }

  constructor(backend: ModelServiceBackend) {
    super(backend, '/assessments');
  }

  queryAssessments(assessmentType: 'lesson-prelearning-assessment', options: { params: AssessmentQuery }): Observable<ResponsePage<LessonPrelearningAssessment>>;
  queryAssessments(assessmentType: AssessmentType, options: { params: AssessmentQuery }) {
    const params = toParams(assessmentType, options.params);
    return this.query('', { params });
  }

  fetchReport(assessmentType: 'lesson-outcome-self-assessment', options: {params: AssessmentQuery}): Observable<LessonOutcomeSelfAssessmentReport>;
  fetchReport(assessmentType: 'lesson-prelearning-assessment', options: { params: AssessmentQuery }): Observable<LessonPrelearningReport>;
  fetchReport(assessmentType: AssessmentType, options: { params: AssessmentQuery}): Observable<Report> {
    const params = toParams(assessmentType, options.params);

    return this.queryUnique('/report', { params, useDecoder: this.reportFromJson.bind(this) });
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



