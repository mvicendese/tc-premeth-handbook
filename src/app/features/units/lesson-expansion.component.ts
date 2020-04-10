import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {ResponsePage} from '../../common/model-base/pagination';
import {LessonOutcomeSelfAssessmentReport, LessonPrelearningReport, Report} from '../../common/model-types/assessment-reports';
import {AppStateService} from '../../app-state.service';
import {map, shareReplay, startWith, switchMap, tap, withLatestFrom} from 'rxjs/operators';
import {LessonSchema} from '../../common/model-types/subjects';
import {LessonPrelearningAssessment} from '../../common/model-types/assessments';
import {ModelRef, modelRefId} from '../../common/model-base/model-ref';
import {LessonStateService} from './lesson-state.service';
import {Unsubscribable} from 'rxjs';
import {ChangeCompletionStateEvent} from '../assessments/shared/prelearning-assessment-item.component';
import {AssessmentsService} from '../../common/model-services/assessments.service';


@Component({
  selector: 'app-units-lesson-expansion',
  template: `
  <ng-container *ngIf="lesson$ | async as lesson">
    <mat-tab-group>
      <mat-tab label="Prelearning">
        <app-lesson-prelearning-results
            [report]="prelearningReport$ | async"
            [assessments]="prelearningAssessments$ | async"
            (completionStateChange)="changePrelearningCompletionState($event)">
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
                [reports]="outcomeSelfAssessmentReports$ | async">
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
    LessonStateService
  ]
})
export class LessonExpansionComponent implements OnInit, OnDestroy {
  private resources: Unsubscribable[] = [];

  @Input() lesson: LessonSchema | undefined;

  readonly lesson$ = this.lessonState.lesson$.pipe(
    shareReplay(1)
  );
  readonly prelearningReport$ = this.lessonState.prelearningReport$.pipe(
    shareReplay(1)
  );
  readonly prelearningAssessments$ = this.lessonState.prelearningAssessments$.pipe(
    shareReplay(1)
  );
  readonly outcomeSelfAssessmentReports$ = this.lessonState.outcomeSelfAssessmentReports$.pipe(
    shareReplay(1)
  );

  constructor(
    readonly lessonState: LessonStateService,
    readonly assessmentsService: AssessmentsService
  ) {}

  ngOnInit() {
    if (this.lesson === undefined) {
      throw new Error(`Uninitialized 'lesson' on app-lesson-expansion`);
    }
    this.resources.push(this.lessonState.init(modelRefId(this.lesson)));

    this.resources.push(this.prelearningReport$.subscribe(report => {
      report.candidateIds.forEach(candidateId => {
        this.lessonState.loadPrelearningAssessment(candidateId);
      })
    }))
  }

  ngOnDestroy() {
    this.resources.forEach(r => r.unsubscribe());
  }

  changePrelearningCompletionState(evt: ChangeCompletionStateEvent): void {
    this.lessonState.setPrelearningAssessmentCompletionState(evt.student, evt.completionState);
  }

}
