import {Component, Input} from '@angular/core';
import {LessonOutcome} from '../../../common/model-types/subjects';
import {LessonOutcomeSelfAssessmentReport} from '../../../common/model-types/assessment-reports';
import {MatDialog} from '@angular/material/dialog';
import {AssessmentsService} from '../../../common/model-services/assessments.service';
import {first, map, switchMap} from 'rxjs/operators';
import {LessonState} from '../lesson/lesson-state';
import {AppStateService} from '../../../app-state.service';
import {SelfAssessmentResultDetailsDialogComponent} from './self-assessment-result-details.component';

@Component({
  selector: 'subjects-lesson-outcome-self-assessment-report',
  template: `
    <div class="title">
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

    <dl>
      <dt>Average Rating</dt>
      <dd>
        <app-star-rating disabled [value]="report.ratingAverage"></app-star-rating>
        ({{report.ratingAverage | number:'1.1-1'}})
      </dd>

      <dt>Students</dt>
      <dd>
          {{report.attemptedCandidateCount}} / {{report.candidateCount}} rated
      </dd>
    </dl>

    <app-lesson-outcome-histogram [report]="report"></app-lesson-outcome-histogram>
  `,
  styles: [`
    :host {
      display: block;
      margin-top: 1rem;
    }
    .title {
      display: flex;
    }

    .title > h4 {
      flex-grow: 1;
    }
  `]
})
export class SelfAssessmentReportComponent {
  @Input() outcome: LessonOutcome | undefined;
  @Input() report: LessonOutcomeSelfAssessmentReport | undefined;

  isLoadingAssessments: boolean;

  constructor(
    readonly appState: AppStateService,
    readonly dialog: MatDialog,
    readonly lessonContext: LessonState,
    readonly assessmentsService: AssessmentsService
  ) {
  }

  get histogramDatas(): ReadonlyArray<{ value: number, label: string, command: any[] }> {
    if (this.outcome == null || this.report == null) {
      return [];
    }
    Object.entries(this.report.candidates).forEach(([candidateId, rating]) => ({
      value: rating,
    }));
  }

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
      this.dialog.open(SelfAssessmentResultDetailsDialogComponent, {
        data: {
          outcome: this.outcome,
          report: this.report,
          assessments,
          lessonContext: this.lessonContext
        }
      });
    });
  }
}
