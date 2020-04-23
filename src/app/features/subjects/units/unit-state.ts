import {Injectable, Provider} from '@angular/core';
import {SubjectNodeRouteData} from '../subject-node-route-data';
import {UnitAssessmentReport} from '../../../common/model-types/assessment-reports';
import {Unsubscribable} from 'rxjs';
import {AssessmentResolveQueue, provideSubjectNodeState, ReportLoader} from '../subjects-feature-state';
import {StudentContextService} from '../../schools/students/student-context.service';
import {UnitAssessment} from '../../../common/model-types/assessments';

export function provideUnitState(): Provider[] {
  return [
    ...provideSubjectNodeState('unit-assessment', ['block-assessment']),
    UnitState
  ];
}

@Injectable()
export class UnitState {
  readonly unit$ = this.subjectNodeRouteData.unit$;

  readonly unitAssessmentReport$ = this.reportLoader.report$;
  readonly unitAssessments$ = this.assessmentResolveQueue.assessments$;

  readonly blockAssessmentReports$ = this.reportLoader.childReportsOfType('block-assessment');

  constructor(
    readonly students: StudentContextService,
    readonly subjectNodeRouteData: SubjectNodeRouteData,
    readonly assessmentResolveQueue: AssessmentResolveQueue<UnitAssessment>,
    readonly reportLoader: ReportLoader<UnitAssessmentReport>
  ) {}

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
