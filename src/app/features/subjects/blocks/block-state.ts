import {Injectable, Provider} from '@angular/core';
import {BehaviorSubject, combineLatest, defer, Observable, Subject, Subscription, Unsubscribable} from 'rxjs';
import {AssessmentsService} from '../../../common/model-services/assessments.service';
import {AppStateService} from '../../../app-state.service';
import {Block, LessonSchema, Unit} from '../../../common/model-types/subjects';
import {distinctUntilChanged, filter, first, map, pluck, shareReplay, switchMap, withLatestFrom} from 'rxjs/operators';
import {ModelRef, modelRefId, Resolve} from '../../../common/model-base/model-ref';
import {SubjectClass} from '../../../common/model-types/schools';
import {BlockAssessmentReport, LessonPrelearningReport} from '../../../common/model-types/assessment-reports';
import {SubjectNodeRouteData} from '../subject-node-route-data';
import {ModelResolveQueue} from '../../../common/model-base/resolve-queue';
import {BlockAssessment} from '../../../common/model-types/assessments';
import {StudentContextService} from '../../schools/students/student-context.service';
import {provideSubjectNodeState} from '../subject-node-state';
import {AssessmentResolveQueue} from '../assessment-resolve-queue';
import {AssessmentReportLoader} from '../assessment-report-loader';

export function provideBlockState(): Provider[] {
  return [
    ...provideSubjectNodeState({
      assessmentType: 'block-assessment',
      childAssessmentTypes: ['lesson-prelearning-assessment']
    }),
    BlockState
  ]
}

@Injectable()
export class BlockState {
  constructor(
    readonly students: StudentContextService,
    readonly nodeRouteData: SubjectNodeRouteData,
    readonly assessmentResolveQueue: AssessmentResolveQueue<BlockAssessment>,
    readonly reportLoader: AssessmentReportLoader<BlockAssessmentReport>
  ) {}

  readonly block$ = this.nodeRouteData.block$;

  readonly blockAssessmentReport$ = this.reportLoader.report$;

  readonly lessonPrelearningReports$ = this.reportLoader.childReportsOfType('lesson-prelearning-assessment');

  init(): Unsubscribable {
    const resolveQueue = this.assessmentResolveQueue.init();
    const reportLoader = this.reportLoader.init();

    return {
      unsubscribe: () => {
        resolveQueue.unsubscribe();
        reportLoader.unsubscribe();
      }
    };
  }
}
