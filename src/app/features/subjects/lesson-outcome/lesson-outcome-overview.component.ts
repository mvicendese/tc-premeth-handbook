import {Component, Input} from '@angular/core';
import {LessonOutcome} from '../../../common/model-types/subjects';

@Component({
  selector: 'subjects-lesson-outcome-overview',
  template: `
    <h3>{{outcome.description}}</h3>
  `
})
export class LessonOutcomeOverviewComponent {
  @Input() outcome: LessonOutcome;
}
