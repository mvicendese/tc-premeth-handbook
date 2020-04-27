import {Component, Input, OnInit} from '@angular/core';
import {LessonPrelearningAssessmentProgress} from '../../../../common/model-types/assessment-progress';
import {StudentState} from '../student-state';

@Component({
  selector: 'schools-student-progress-prelearning-assessment-tab',
  template: `
    <ng-container *ngIf="progress != null">
      <p>
        Out of {{progress.assessmentCount}} total prelearning assessments,
      </p>
      <dl>
        <dt>Number not attempted</dt>
        <dd>{{progress.notAttemptedCount}} were not sat</dd>
      </dl>
      <p>Out of the remaining {{progress.attemptedAssessmentCount}} assessments,</p>
      <dl>
        <dt>No evidence</dt>
        <dd>
          {{progress.noCompletionCount}}
          <ng-container *ngTemplateOutlet="percentage; context: {value: progress.noCompletionPercent}">
          </ng-container>
        </dd>

        <dt>Partially complete</dt>
        <dd>
          {{progress.partiallyCompleteAssessmentCount}}
          <ng-container *ngTemplateOutlet="percentage; context: {value: progress.partiallyCompleteAssessmentPercent}">
          </ng-container>
        </dd>

        <dt>Complete</dt>
        <dd>{{progress.completeAssessmentCount}}
          <ng-container *ngTemplateOutlet="percentage; context: {value: progress.completeAssessmentPercent}">
          </ng-container>
        </dd>
      </dl>
    </ng-container>

    <ng-template #percentage let-value="value">
      ({{value | number:'2.0-1'}} %)
    </ng-template>
  `,
  styleUrls: [
    './prelearning-assessment-tab.component.scss'
  ]
})
export class PrelearningAssessmentTabComponent implements OnInit {
  @Input() progress: LessonPrelearningAssessmentProgress;

  constructor(
    readonly studentState: StudentState
  ) {}

  ngOnInit() {
    this.studentState.loadProgressSubject.next('lesson-prelearning-assessment');
  }
}
