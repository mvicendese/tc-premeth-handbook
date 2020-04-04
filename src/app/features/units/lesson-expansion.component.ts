import {Component, Input} from '@angular/core';
import {ResponsePage} from '../../common/model-base/pagination';
import {LessonPrelearningReport, Report} from '../../common/model-types/assessment-reports';
import {AppStateService} from '../../app-state.service';
import {map, shareReplay, switchMap, tap, withLatestFrom} from 'rxjs/operators';
import {UnitContextService} from './unit-context.service';
import {AssessmentQuery, AssessmentsService} from '../../common/model-services/assessments.service';
import {combineLatest, defer, Observable, of} from 'rxjs';
import {LessonSchema} from '../../common/model-types/subjects';
import {LessonPrelearningAssessment} from '../../common/model-types/assessments';
import {ModelRef} from '../../common/model-base/model-ref';


@Component({
  selector: 'app-units-lesson-expansion',
  template: `
    <mat-tab-group>
      <mat-tab label="Prelearning">
        <app-lesson-prelearning-results
          [report]="prelearningReport$ | async"
          [assessments]="prelearningAssessments$ | async"
          (markCompleted)="markPrelearningAssessmentComplete($event)">
        </app-lesson-prelearning-results>
      </mat-tab>
      <mat-tab label="Student outcomes" class="d-flex">
        <div class="outcomes-content d-flex">
          <div class="outcomes-overview flex-grow-1">
            <h4>Overview</h4>
          </div>
          <div class="outcome-details flex-grow-2">
            <div *ngFor="let outcome of lesson.outcomes">
              <app-lesson-outcome-results [outcome]="outcome"></app-lesson-outcome-results>
            </div>
          </div>
        </div>
      </mat-tab>
    </mat-tab-group>
  `,
  styles: [`
    .d-flex {
      display: flex;
    }

    .flex-grow-1 {
      flex-grow: 1;
    }
    .flex-grow-2 {
      flex-grow: 2;
    }

    .outcomes-content {
      margin-top: 2rem;
    }
  `]
})
export class LessonExpansionComponent {
  @Input() lesson: LessonSchema | undefined;

  constructor(
    readonly appState: AppStateService,
    readonly assessmentService: AssessmentsService
  ) {}

  readonly assessmentQueryParams$: Observable<AssessmentQuery> = defer(() =>
    combineLatest([
      this.appState.subjectClass$,
    ]).pipe(
      map(([cls]) => ({
        class: cls && cls.id || undefined,
        student: undefined,
        node: this.lesson
      }))
    )
  );

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

  markPrelearningAssessmentComplete([assessment, isCompleted]: [ModelRef<LessonPrelearningAssessment>, boolean]) {
    this.assessmentService.markPrelearningAssessmentComplete(assessment, isCompleted);
  }
}
