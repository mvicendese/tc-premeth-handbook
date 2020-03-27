import {ModelService, ModelServiceBackend} from '../model-base/model-service';
import {
  Assessment,
  AssessmentParams,
  AssessmentType,
  BlockAssessment,
  BlockAssessmentParams,
  LessonPrelearningAssessment, LessonPrelearningAssessmentParams
} from '../model-types/assessment';
import {Injectable} from '@angular/core';
import {SubjectNode} from '../model-types/subject';
import {getModelRefId, ModelRef} from '../model-base/model-ref';
import {ModelParams} from '../model-base/model';
import {JsonObject} from '../model-base/model-key-transform';
import {LessonPrelearningReport, parseReport, Report} from '../model-types/assessment-report';
import {map} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {ResponsePage} from '../model-base/pagination';

export interface AssessmentQuery {
  student?: string | string[];
  class?: string | string[];

  node?: ModelRef<SubjectNode>;
}

function toParams(type: string, query: AssessmentQuery): { [k: string]: string | string[] } {
  const params = {
    type,
    ...query,
    node: query.node && getModelRefId(query.node)
  };
  Object.entries(params)
    .filter(([k, v]) => v === undefined)
    .forEach(([k]) => delete params[k]);
  return params;
}

@Injectable({providedIn: 'root'})
export class AssessmentsService extends ModelService<Assessment> {

  fromObject(obj: JsonObject) {
    switch (obj.type) {
      case 'block-assessment':
        return new BlockAssessment(obj as any);
      case 'lesson-prelearning-assessment':
        return new LessonPrelearningAssessment(obj as any);
      case 'unit-assessment':
      // return new UnitAssessment(params);
      case 'lesson-outcome-self-assessment':
      // return new LessonOutcomeSelfAssessment(params)
      default:
        throw new Error(`Unrecognised assessment type ${obj.type}`);
    }
  }

  constructor(backend: ModelServiceBackend) {
    super(backend, '/assessments');
  }


  queryAssessments(assessmentType: 'lesson-prelearning-assessment', options: { params: AssessmentQuery }): Observable<ResponsePage<LessonPrelearningAssessment>>;
  queryAssessments(assessmentType: AssessmentType, options: { params: AssessmentQuery }) {
    const params = toParams(assessmentType, options.params);
    return this.query('', { params });
  }

  fetchReport(assessmentType: 'lesson-prelearning-assessment', options: { params: AssessmentQuery }): Observable<LessonPrelearningReport>;
  fetchReport(assessmentType: AssessmentType, options: { params: AssessmentQuery}): Observable<Report> {
    const params = toParams(assessmentType, options.params);

    return this.queryUnique('/report', { params, useDecoder: parseReport });
  }
}



