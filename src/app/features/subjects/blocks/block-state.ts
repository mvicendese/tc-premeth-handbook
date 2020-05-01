import {Injectable, Provider} from '@angular/core';
import {defer, Unsubscribable} from 'rxjs';
import {BlockAssessmentReport} from '../../../common/model-types/assessment-reports';
import {SubjectNodeRouteData} from '../subject-node-route-data';
import {BlockAssessment} from '../../../common/model-types/assessments';
import {StudentContextService} from '../../schools/students/student-context.service';
import {provideSubjectNodeState} from '../subject-node-state';
import {AssessmentResolveQueue} from '../assessment-resolve-queue';
import {AssessmentReportLoader} from '../assessment-report-loader';
import {SubjectNodePageContainerState} from '../subject-node-page-container-state';
import {Block} from '../../../common/model-types/subjects';
import {filter} from 'rxjs/operators';

export function provideBlockState(): Provider[] {
  return [
    ...provideSubjectNodeState({
      assessmentType: 'block-assessment',
      childAssessmentTypes: ['lesson-prelearning-assessment']
    }),
    BlockState
  ];
}

@Injectable()
export class BlockState {
  constructor(
    readonly subjectNodePageState: SubjectNodePageContainerState,
    readonly students: StudentContextService,
    readonly nodeRouteData: SubjectNodeRouteData,
    readonly assessmentResolveQueue: AssessmentResolveQueue<BlockAssessment>,
    readonly reportLoader: AssessmentReportLoader<BlockAssessmentReport>
  ) {}

  readonly block$ = defer(() => this.nodeRouteData.block$.pipe(
    filter((b): b is Block => b != null)
  ));

  readonly blockAssessmentReport$ = this.reportLoader.report$;

  readonly lessonPrelearningReports$ = this.reportLoader.childReportsOfType('lesson-prelearning-assessment');

  init(): Unsubscribable {
    const container = this.subjectNodePageState.addSubjectNodeSource(this.nodeRouteData.subjectNode$);

    const resolveQueue = this.assessmentResolveQueue.init();
    const reportLoader = this.reportLoader.init();

    return {
      unsubscribe: () => {
        container.unsubscribe();
        resolveQueue.unsubscribe();
        reportLoader.unsubscribe();
      }
    };
  }
}
