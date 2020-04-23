import {Component, Input} from '@angular/core';
import {LessonOutcome} from '../../../common/model-types/subjects';
import {LessonOutcomeSelfAssessmentReport} from '../../../common/model-types/assessment-reports';

@Component({
  selector: 'subjects-lesson-outcome-overview',
  template: `
    <span class="title">
      <h3>{{outcome.description}}</h3>
    </span>
    <span class="separator"></span> 
    <span class="rating">
      <app-star-rating [value]="report.ratingAverage" disabled></app-star-rating>
      &nbsp;<span class="rating-average">({{report.ratingAverage | number:'1.1-1'}})</span>
    </span>
  `,
  styles: [`
    :host {
      display: flex;
      align-items: center;
    }
    .title h3 { margin: 0; }
    .separator { flex-grow: 1; }
    .rating-average { margin-top: 0.2em; }
  `]
})
export class LessonOutcomeOverviewComponent {
  @Input() outcome: LessonOutcome;
  @Input() report: LessonOutcomeSelfAssessmentReport;
}
