import {Injectable, Provider} from '@angular/core';
import {SubjectNodeRouteData} from '../subject-node-route-data';
import {UnitAssessmentReport} from '../../../common/model-types/assessment-reports';
import {Unsubscribable} from 'rxjs';
import {StudentContextService} from '../../schools/students/student-context.service';
import {UnitAssessment} from '../../../common/model-types/assessments';
import {provideSubjectNodeState} from '../subject-node-state';
import {AssessmentResolveQueue} from '../assessment-resolve-queue';
import {AssessmentReportLoader} from '../assessment-report-loader';
import {SubjectNodePageContainerState} from '../subject-node-page-container-state';
import {filter} from 'rxjs/operators';
import {Unit} from '../../../common/model-types/subjects';

export function provideUnitState(): Provider[] {
  return [
    ...provideSubjectNodeState({
      assessmentType: 'unit-assessment',
      childAssessmentTypes:  ['block-assessment']
    }),
    UnitState
  ];
}

@Injectable()
export class UnitState {
  readonly unit$ = this.subjectNodeRouteData.unit$.pipe(
    filter((u): u is Unit => u != null)
  );

  readonly unitAssessmentReport$ = this.reportLoader.report$;
  readonly unitAssessments$ = this.assessmentResolveQueue.assessments$;

  readonly blockAssessmentReports$ = this.reportLoader.childReportsOfType('block-assessment');

  constructor(
    readonly container: SubjectNodePageContainerState,
    readonly students: StudentContextService,
    readonly subjectNodeRouteData: SubjectNodeRouteData,
    readonly assessmentResolveQueue: AssessmentResolveQueue<UnitAssessment>,
    readonly reportLoader: AssessmentReportLoader<UnitAssessmentReport>
  ) {}

  init(): Unsubscribable {
    const container = this.container.addSubjectNodeSource(this.unit$);

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
