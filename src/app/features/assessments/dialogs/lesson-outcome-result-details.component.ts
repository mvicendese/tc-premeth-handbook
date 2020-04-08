import {Component, Inject, Input} from '@angular/core';
import {LessonOutcome} from '../../../common/model-types/subjects';
import {ResponsePage} from '../../../common/model-base/pagination';
import {LessonOutcomeSelfAssessment} from '../../../common/model-types/assessments';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Student} from '../../../common/model-types/schools';
import {LessonOutcomeSelfAssessmentReport} from '../../../common/model-types/assessment-reports';
import {LessonContextService} from '../../units/unit-context.service';
import {Observable} from 'rxjs';
import {shareReplay} from 'rxjs/operators';

interface OutcomeResultDialogData {
  readonly lessonContext: LessonContextService;
  readonly outcome: LessonOutcome;
  readonly report: LessonOutcomeSelfAssessmentReport;
  readonly assessments: ResponsePage<LessonOutcomeSelfAssessment>;
}


@Component({
  selector: 'app-lesson-outcome-student-breakdown-dialog',
  template: `
    <h1 mat-dialog-title>
      {{data.outcome.name}} student data
    </h1>
    <div mat-dialog-content>
      <mat-list>
        <mat-list-item *ngFor="let candidateId of data.report.candidateIds">
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
export class LessonOutcomeResultDetailsDialogComponent {
  constructor(
    readonly ref: MatDialogRef<LessonOutcomeResultDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) readonly data: OutcomeResultDialogData
  ) {}

  readonly students$ = this.data.lessonContext.students$.pipe(
    shareReplay(1)
  );

  close() {
    this.ref.close();
  }
}
