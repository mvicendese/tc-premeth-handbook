import {Component, Input} from '@angular/core';
import {LessonSchema} from '../../common/model-types/lesson-schema';
import {Student} from '../../common/model-types/student';
import {Assessment, LessonPrelearningAssessment} from '../../common/model-types/assessment';
import {ResponsePage} from '../../common/model-base/pagination';
import {LessonPrelearningReport, Report} from '../../common/model-types/assessment-report';
import {AppStateService} from '../../app-state.service';
import {map, shareReplay, switchMap, tap, withLatestFrom} from 'rxjs/operators';
import {UnitContextService} from './unit-context.service';
import {AssessmentQuery, AssessmentsService} from '../../common/model-services/assessments.service';
import {defer, Observable} from 'rxjs';


@Component({
  selector: 'app-units-lesson-expansion',
  template: `
    <h3>Prelearning</h3>
    <app-lesson-prelearning-results
      [report]="prelearningReport$ | async"
      [assessments]="prelearningAssessments$ | async">
    </app-lesson-prelearning-results>
  `
})
export class LessonExpansionComponent {
  @Input() lesson: LessonSchema | undefined;

  readonly students$ = this.unitTableParams.students$.pipe(
    shareReplay(1)
  );

  constructor(
    readonly unitTableParams: UnitContextService,
    readonly assessmentService: AssessmentsService
  ) {}

  readonly assessmentQueryParams$: Observable<AssessmentQuery> = defer(() =>
    this.students$.pipe(
      map(page => ({
        class: page.params.class,
        student: page.params.student,
        node: this.lesson
      })
    )
  ));

  readonly prelearningReport$: Observable<LessonPrelearningReport> = this.assessmentQueryParams$.pipe(
    switchMap(params => {
      return this.assessmentService.fetchReport('lesson-prelearning-assessment', { params });
    }),
    shareReplay(1)
  );

  readonly prelearningAssessments$: Observable<ResponsePage<LessonPrelearningAssessment>> = this.assessmentQueryParams$.pipe(
    switchMap(params => {
      return this.assessmentService.queryAssessments('lesson-prelearning-assessment', { params });
    }),
    shareReplay(1)
  );
}
