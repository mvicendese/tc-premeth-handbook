import {Injectable, Provider} from '@angular/core';
import {Unsubscribable} from 'rxjs';
import {BlockAssessmentReport} from '../../../common/model-types/assessment-reports';
import {SubjectNodeRouteData} from '../subject-node-route-data';
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
