import {Component, Input} from '@angular/core';
import {LessonOutcome} from '../../../common/model-types/subjects';
import {LessonOutcomeSelfAssessmentReport} from '../../../common/model-types/assessment-reports';
import {MatDialog} from '@angular/material/dialog';
import {LessonOutcomeResultDetailsDialogComponent} from '../dialogs/lesson-outcome-result-details.component';
import {AssessmentsService} from '../../../common/model-services/assessments.service';
import {first, map, switchMap} from 'rxjs/operators';
import {LessonStateService} from '../../units/lesson-state.service';
import {AppStateService} from '../../../app-state.service';

@Component({
  selector: 'app-lesson-outcome-results',
  template: `
    <ng-container>
      <div class="title">
        <h4>{{outcome.description}}</h4>
        <button mat-button
                *ngIf="!isLoadingAssessments; else assessmentsLoadingIndicator"
                (click)="openStudentResults()">
          <mat-icon>open_in_new</mat-icon>
          View students
        </button>

        <ng-template #assessmentsLoadingIndicator>
          <button mat-button disabled>
            <app-loading></app-loading>
          </button>
        </ng-template>
      </div>

      <dl *ngIf="reports && reports[outcome.id] as report">
        <dt>Average Rating</dt>
        <dd>
          <app-star-rating disabled [value]="report.ratingAverage"></app-star-rating>
          ({{report.ratingAverage | number:'1.1-1'}})
        </dd>

        <dt>Students</dt>
        <dd>
          {{report.attemptedCandidateCount}} / {{report.totalCandidateCount}} rated
        </dd>
      </dl>

      <mat-divider></mat-divider>
    </ng-container>
  `,
  styles: [`
    .title {
      display: flex;
    }

    .title > h4 {
      flex-grow: 1;
    }
  `]
})
export class LessonOutcomeResultsComponent {
  @Input() outcome: LessonOutcome | undefined;
  @Input() reports: { [outcomeId: string]: LessonOutcomeSelfAssessmentReport } = {};

  isLoadingAssessments: boolean;

  constructor(
    readonly appState: AppStateService,
    readonly dialog: MatDialog,
    readonly lessonContext: LessonStateService,
    readonly assessmentsService: AssessmentsService
  ) {}

  openStudentResults() {
    this.isLoadingAssessments = true;
    this.appState.activeSubjectClass$.pipe(
      first(),
      switchMap((subjectClass) =>
        this.assessmentsService.queryAssessments('lesson-outcome-self-assessment', {
          params: {
            node: this.outcome as LessonOutcome,
            class: subjectClass
          }
        })
      ),
      map(page => page.resultMap)
    ).subscribe(assessments => {
      this.isLoadingAssessments = false;
      this.dialog.open(LessonOutcomeResultDetailsDialogComponent, {
        data: {
          outcome: this.outcome,
          report: this.reports[this.outcome.id],
          assessments,
          lessonContext: this.lessonContext
        }
      });
    });
  }
}
