import {Inject, Injectable, InjectionToken, Provider} from '@angular/core';
import {Assessment, AssessmentType} from '../../common/model-types/assessments';
import {AssessmentQuery, AssessmentsService} from '../../common/model-services/assessments.service';
import {AppStateService} from '../../app-state.service';
import {SubjectNodeRouteData} from './subject-node-route-data';
import {Observable, Unsubscribable} from 'rxjs';
import {ModelResolveQueue} from '../../common/model-base/resolve-queue';
import {first, map, switchMap} from 'rxjs/operators';
import {ModelRef, modelRefId} from '../../common/model-base/model-ref';
import {SubjectNode} from '../../common/model-types/subjects';

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
    readonly assessments: AssessmentsService,
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
    this.subjectNodeData.subjectNode$.pipe(first(), switchMap(node => this.resolveAssessments(node.id, candidateIds)))
  );

  readonly assessments$: Observable<{ [candidateId: string]: T }> = this.resolveQueue.allResolved$;

  loadAssessment(candidateId: string, options?: {force: boolean}): Observable<T> {
    console.log('queuing ' + candidateId);
    return this.resolveQueue.queue(candidateId, options);
  }

  protected resolveAssessments(node: ModelRef<SubjectNode>, candidateIds: readonly string[]): Observable<{ [candidateId: string]: T }> {
    return this.appStateService.activeSubjectClass$.pipe(first(),
      map(subjectClass => ({
          subjectClass: subjectClass && subjectClass.id,
          node,
          student: [...candidateIds]
        } as AssessmentQuery)
      ),
      switchMap((params: AssessmentQuery) =>
        this.assessments.queryAssessments<T>(this.assessmentType, {params})
      ),
      map(page => {
        console.log('page', page.results);
        return page.resultMap(result => modelRefId(result.student))
      })
    );
  }
}
