import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {ResponsePage} from '../../common/model-base/pagination';
import {LessonOutcomeSelfAssessmentReport, LessonPrelearningReport, Report} from '../../common/model-types/assessment-reports';
import {AppStateService} from '../../app-state.service';
import {map, shareReplay, startWith, switchMap, tap, withLatestFrom} from 'rxjs/operators';
import {BlockContextService, LessonContextService} from './unit-context.service';
import {AssessmentQuery, AssessmentsService} from '../../common/model-services/assessments.service';
import {combineLatest, defer, Observable, of, Unsubscribable} from 'rxjs';
import {LessonSchema} from '../../common/model-types/subjects';
import {LessonPrelearningAssessment} from '../../common/model-types/assessments';
import {ModelRef, modelRefId} from '../../common/model-base/model-ref';


@Component({
  selector: 'app-units-lesson-expansion',
  template: `
  <ng-container *ngIf="lesson$ | async as lesson">
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
              <app-lesson-outcome-results
                [outcome]="outcome"
                [reports]="lessonOutcomeReports$ | async">
              </app-lesson-outcome-results>
            </div>
          </div>
        </div>
      </mat-tab>
    </mat-tab-group>
  </ng-container>
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
  `],
  providers: [
    LessonContextService
  ]
})
export class LessonExpansionComponent implements OnInit, OnDestroy {
  private resources: Unsubscribable[] = [];

  @Input() lesson: LessonSchema | undefined;

  readonly lesson$ = this.lessonContext.lesson$.pipe(
    shareReplay(1)
  );
  readonly prelearningReport$ = this.lessonContext.prelearningReport$.pipe(
    shareReplay(1)
  );
  readonly prelearningAssessments$ = this.lessonContext.prelearningAssessments$.pipe(
    shareReplay(1)
  );
  readonly lessonOutcomeReports$ = this.lessonContext.outcomeSelfAssessmentReports$.pipe(
    startWith({}),
    shareReplay(1)
  );

  constructor(
    readonly appState: AppStateService,
    readonly assessmentService: AssessmentsService,
    readonly lessonContext: LessonContextService
  ) {}

  ngOnInit() {
    if (this.lesson === undefined) {
      throw new Error(`Uninitialized 'lesson' on app-lesson-expansion`);
    }
    this.resources.push(this.lessonContext.init(modelRefId(this.lesson)));
  }

  ngOnDestroy() {
    this.resources.forEach(r => r.unsubscribe());
  }

  markPrelearningAssessmentComplete([assessment, isComplete]: [ModelRef<LessonPrelearningAssessment>, boolean]) {

  }
}
