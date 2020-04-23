import {Component, Inject, Input} from '@angular/core';
import {LessonOutcome} from '../../../common/model-types/subjects';
import {ResponsePage} from '../../../common/model-base/pagination';
import {LessonOutcomeSelfAssessment} from '../../../common/model-types/assessments';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {shareReplay} from 'rxjs/operators';
import {LessonState} from '../lesson/lesson-state';
import {LessonOutcomeSelfAssessmentReport} from '../../../common/model-types/assessment-reports';

interface OutcomeResultDialogData {
  readonly lessonContext: LessonState;
  readonly outcome: LessonOutcome;
  readonly report: LessonOutcomeSelfAssessmentReport;
  readonly assessments: ResponsePage<LessonOutcomeSelfAssessment>;
}


@Component({
  template: `
    <h1 mat-dialog-title>
      {{data.outcome.description}} student data
    </h1>
    <div mat-dialog-content>
      <mat-list>
        <mat-list-item
            *ngFor="let candidateId of data.report.candidates">
          <ng-container *ngIf="(students$ | async)[candidateId] as candidate">
            {{candidate.fullName}}
          </ng-container>
        </mat-list-item>
      </mat-list>
    </div>
    <div mat-dialog-actions>
      <button mat-button (click)="close()">Close</button>
    </div>
  `
})
export class SelfAssessmentResultDetailsDialogComponent {
  constructor(
    readonly ref: MatDialogRef<SelfAssessmentResultDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) readonly data: OutcomeResultDialogData
  ) {}

  readonly students$ = this.data.lessonContext.students.all$.pipe(
    shareReplay(1)
  );

  close() {
    this.ref.close();
  }
}
