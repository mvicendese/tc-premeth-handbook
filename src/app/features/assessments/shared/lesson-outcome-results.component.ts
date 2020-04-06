import {Component, Input} from '@angular/core';
import {LessonOutcome} from '../../../common/model-types/subjects';
import {LessonOutcomeSelfAssessmentReport} from '../../../common/model-types/assessment-reports';
import {AssessmentsService} from '../../../common/model-services/assessments.service';


@Component({
  selector: 'app-lesson-outcome-results',
  template: `
    <ng-container>
      <h4>{{outcome.description}}</h4>

      <dl *ngIf="reports && reports[outcome.id] as report">
        <dt>Average Rating</dt>
        <dd>
          <app-star-rating disabled [value]="report.averageRating"></app-star-rating>
          ({{report.averageRating}})</dd>
      </dl>

      <mat-divider></mat-divider>
    </ng-container>
  `
})
export class LessonOutcomeResultsComponent {
  @Input() outcome: LessonOutcome | undefined;
  @Input() reports: {[outcomeId: string]: LessonOutcomeSelfAssessmentReport} = {};
}
