import {Injectable, Provider} from '@angular/core';
import {SubjectNodeRouteData} from '../subject-node-route-data';
import {UnitAssessmentReport} from '../../../common/model-types/assessment-reports';
import {defer, Observable, Unsubscribable} from 'rxjs';
import {StudentContextService} from '../../schools/students/student-context.service';
import {UnitAssessment} from '../../../common/model-types/assessments';
import {provideSubjectNodeState} from '../subject-node-state';
import {AssessmentResolveQueue} from '../assessment-resolve-queue';
import {AssessmentReportLoader} from '../assessment-report-loader';
import {SubjectNodePageContainerState} from '../subject-node-page-container-state';
import {filter, switchMap, switchMapTo, tap} from 'rxjs/operators';
import {Unit} from '../../../common/model-types/subjects';
import {ModelRef} from '../../../common/model-base/model-ref';
import {Student} from '../../../common/model-types/schools';

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
  readonly unitAssessments$ = defer(() =>
    this.unitAssessmentReport$.pipe(
      tap(report => {
        const candidates = report.candidates;
        for (const candidate of candidates) {
          this.assessmentResolveQueue.loadAssessment(ModelRef.id(candidate));
        }
      }),
      switchMapTo(this.assessmentResolveQueue.assessments$)
    )
  );

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

  getStudent(ref: ModelRef<Student>): Observable<Student> {
    return this.students.student(ref);
  }

}
