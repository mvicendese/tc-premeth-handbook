import {Component} from '@angular/core';
import {LessonState} from './lesson-state';
import {LessonOutcomeSelfAssessmentReport} from '../../../common/model-types/assessment-reports';
import {map, shareReplay} from 'rxjs/operators';
import {LessonOutcome} from '../../../common/model-types/subjects';
import {combineLatest} from 'rxjs';

interface OutcomeView {
    readonly outcome: LessonOutcome;
    readonly report: LessonOutcomeSelfAssessmentReport;
}

@Component({
    selector: 'subjects-lesson-outcomes-tab',
    template: `
      <mat-accordion>
        <mat-expansion-panel *ngFor="let view of (displayOutcome$ | async)">
          <mat-expansion-panel-header>
            <subjects-lesson-outcome-overview 
              [outcome]="view.outcome"
              [report]="view.report">
            </subjects-lesson-outcome-overview>
          </mat-expansion-panel-header> 
          <ng-template matExpansionPanelContent>
            <subjects-lesson-outcome-self-assessment-report
              [outcome]="view.outcome"
              [report]="view.report"
            >
            </subjects-lesson-outcome-self-assessment-report>
          </ng-template> 
        </mat-expansion-panel>
      </mat-accordion>
    `,
  styles: [`
    subjects-lesson-outcome-overview {
      width: 80%;
    }
    
    mat-accordion {
      width: 100%;
    }
  `]
})
export class LessonOutcomesTabComponent {
    readonly lesson$ = this.lessonState.lesson$.pipe(
        shareReplay(1)
    );

    readonly outcomeSelfAssessmentReports = this.lessonState.outcomeSelfAssessmentReports$;

    readonly displayOutcome$ = combineLatest([
        this.lesson$,
        this.outcomeSelfAssessmentReports
    ]).pipe(
        map(([lesson, reports]) =>
            lesson.outcomes.map(outcome => ({
                outcome,
                report: reports[outcome.id]
            }))
        ),
        shareReplay(1)
    );

    constructor(
        readonly lessonState: LessonState
    ) {
    }

}
