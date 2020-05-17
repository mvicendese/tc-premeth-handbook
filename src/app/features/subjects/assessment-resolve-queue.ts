import {Inject, Injectable, InjectionToken, Provider} from '@angular/core';
import {Assessment, AssessmentType} from '../../common/model-types/assessments';
import {AssessmentQuery, AssessmentsModelApiService} from '../../common/model-services/assessments.service';
import {AppStateService} from '../../app-state.service';
import {SubjectNodeRouteData} from './subject-node-route-data';
import {Observable, Unsubscribable} from 'rxjs';
import {ModelResolveQueue} from '../../common/model-api-context/resolve-queue';
import {first, map, switchMap} from 'rxjs/operators';
import {SubjectNode} from '../../common/model-types/subjects';
import {Ref} from '../../common/model-base/ref';
import {Student} from '../../common/model-types/schools';

export interface AssessmentResolveQueueOptions {
  readonly assessmentType: AssessmentType;
}

export const ASSESSMENT_RESOLVE_QUEUE_OPTIONS = new InjectionToken('ASSESSMENT_RESOLVE_QUEUE_OPTIONS');

export function provideAssessmentResolveQueueOptions(options: {assessmentType: AssessmentType}): Provider {
  return {
    provide: ASSESSMENT_RESOLVE_QUEUE_OPTIONS,
    useValue: options
  };
}

@Injectable()
export class AssessmentResolveQueue<T extends Assessment> {

  constructor(
    readonly assessments: AssessmentsModelApiService,
    readonly appStateService: AppStateService,
    @Inject(ASSESSMENT_RESOLVE_QUEUE_OPTIONS) readonly options: AssessmentResolveQueueOptions,
    readonly subjectNodeData: SubjectNodeRouteData
  ) {
  }

  get assessmentType() {
    return this.options.assessmentType as T['type'];
  }

  init(): Unsubscribable {
    return this.resolveQueue.init();
  }

  protected readonly resolveQueue = new ModelResolveQueue<T>((candidateIds) =>
    this.subjectNodeData.subjectNode$.pipe(first(), switchMap(node => this.resolveAssessments(node, candidateIds)))
  );

  readonly assessments$: Observable<{ [candidateId: string]: T }> = this.resolveQueue.allResolved$;

  loadAssessment(candidate: Ref<Student>, options?: {force: boolean}): Observable<T> {
    return this.resolveQueue.queue(candidate.id, options);
  }

  protected resolveAssessments(node: Ref<SubjectNode>, candidateIds: readonly string[]): Observable<{ [candidateId: string]: T }> {
    return this.appStateService.activeSubjectClass$.pipe(first(),
      map(subjectClass => ({
          subjectClass,
          node,
          student: [...candidateIds]
        } as AssessmentQuery)
      ),
      switchMap((params: AssessmentQuery) =>
        this.assessments.queryAssessments<T>(this.assessmentType, {params})
      ),
      map(page =>
        Object.fromEntries(page.results.map(result => [result.student.id, result]))
      )
    );
  }
}
