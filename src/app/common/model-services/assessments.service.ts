/* tslint:disable:curly */

import {v4 as uuid4} from 'uuid';

import {Injectable, Provider} from '@angular/core';
import {AnyReport} from '../model-types/assessment-reports';
import {Observable} from 'rxjs';
import {LessonSchema, SubjectNode} from '../model-types/subjects';
import {AnyAssessment, Assessment, AssessmentType, LessonPrelearningAssessment,} from '../model-types/assessments';
import {JsonObject} from '../json';
import {Student, SubjectClass} from '../model-types/schools';
import {AnyAttempt, AssessmentAttempt, LessonPrelearningAssessmentAttempt} from '../model-types/assessment-attempt';
import {AnyProgress} from '../model-types/assessment-progress';

import {Comment, CommentableService} from '../../features/base/comment/comment.model';
import {ApiBackend} from '../model-api/api-backend';
import {AbstractModelApiService} from '../model-api/abstract-model-api-service';
import {Ref} from '../model-base/ref';
import {ResponsePage} from '../model-api/response-page';


export interface AssessmentQuery {
  student?: string[] | Ref<Student> | null;
  subjectClass?: Ref<SubjectClass> | null;
  node?: Ref<SubjectNode> | null;

  page?: number;
}

function assessmentQueryToParams(type: AssessmentType, query: AssessmentQuery): { [k: string]: string | string[] } {
  const params: { [k: string]: string | string[] } = { type };
  if (query.student) {
    if (Array.isArray(query.student)) {
      params.student = query.student.join(',');
    } else {
      params.student = query.student.id;
    }
  }
  if (query.subjectClass)
    params.class = query.subjectClass.id;
  if (query.node)
    params.node = query.node.id;
  if (query.page)
    params.page = query.page.toString();
  return params;
}



@Injectable({providedIn: 'root'})
export class AssessmentsModelApiService extends AbstractModelApiService<Assessment>
  implements CommentableService<Assessment> {

  fromJson<U extends Assessment>(object: unknown): U {
    return AnyAssessment.fromJson<U>(object);
  }

  reportFromJson(object: unknown): AnyReport {
    return AnyReport.fromJson(object);
  }

  progressFromJson(object: unknown): AnyProgress {
    return AnyProgress.fromJson(object);
  }

  constructor(backend: ApiBackend) {
    super(backend, ['/assessments']);
  }

  fetchAssessment<T extends Assessment>(
    assessmentType: T['type'],
    options: { params: { node: Ref<LessonSchema>, student: Ref<Student> }
  }): Observable<T> {
    const params = assessmentQueryToParams(assessmentType, options.params);
    return this.queryUnique([], {params, decoder: (obj) => this.fromJson(obj) as any});
  }

  queryAssessments<T extends Assessment>(assessmentType: T['type'], options: { params: AssessmentQuery }): Observable<ResponsePage<T>> {
    const params = assessmentQueryToParams(assessmentType, options.params);
    return this.query([], {params, itemDecoder: (obj) => this.fromJson(obj) as any});
  }

  fetchReport<Report extends AnyReport>(assessmentType: Report['assessmentType'], options: { params: AssessmentQuery }): Observable<Report> {
    const params = assessmentQueryToParams(assessmentType, options.params);
    // A report is created on fetch, so one always exists, as long as the params are valid.
    return this.queryUnique(['reports'], {params, decoder: this.reportFromJson.bind(this)}) as Observable<Report>;
  }

  queryReports<Report extends AnyReport>(
    assessmentType: Report['assessmentType'],
    options: { params: AssessmentQuery }
  ): Observable<ResponsePage<Report>> {
    const params = assessmentQueryToParams(assessmentType, options.params);
    return this.query(['reports'], {params, itemDecoder: this.reportFromJson.bind(this)});
  }

  fetchProgress<Progress extends AnyProgress>(
    assessmentType: Progress['assessmentType'],
    options: { params: AssessmentQuery }
  ): Observable<Progress> {
    const params = assessmentQueryToParams(assessmentType, options.params);
    return this.queryUnique(['progress'], {params, decoder: this.progressFromJson.bind(this)});
  }

  queryProgresses<Progress extends AnyProgress>(
    assessmentType: Progress['assessmentType'],
    options: { params: AssessmentQuery }
  ): Observable<ResponsePage<Progress>> {
    const params = assessmentQueryToParams(assessmentType, options.params);
    return this.query(['progress'], {params, itemDecoder: this.progressFromJson.bind(this)});
  }

  saveAssessment(type: AssessmentType, options: Partial<Assessment>): Observable<Assessment> {
    const id = options.id || uuid4();

    const student = options.student && options.student.id;
    if (student == null) {
      throw new Error(`A 'student' is required`);
    }

    const subjectNode = options.subjectNode && options.subjectNode.id;
    if (subjectNode == null) {
      throw new Error(`A 'subjectNode' is required`);
    }

    return this.put(id, {type, id, student, subjectNode}, {decoder: AnyAssessment.fromJson});
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
    return this.postDetail(assessment, ['attempt'], body, {
      decoder: (item) => AnyAttempt.fromJson(item)
    });
  }

  addComment(on: Ref<Assessment>, {content}: { content: string }): Observable<Comment> {
    return this.postDetail(on, ['comments'], {content}, { decoder: Comment.fromJson});
  }

  comments(ref: Ref<Assessment>): Observable<ResponsePage<Comment>> {
    return this.queryProperty(ref, 'comments', { itemDecoder: Comment.fromJson });
  }
}
