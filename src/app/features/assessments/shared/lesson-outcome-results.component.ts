import {Component, Input} from '@angular/core';
import {LessonOutcome} from '../../../common/model-types/subjects';
import {LessonOutcomeSelfAssessmentReport} from '../../../common/model-types/assessment-reports';
import {AssessmentsService} from '../../../common/model-services/assessments.service';


@Component({
  selector: 'app-lesson-outcome-results',
  template: `
    <h4>{{outcome.description}}</h4>
    <mat-divider></mat-divider>
  `
})
export class LessonOutcomeResultsComponent {
  @Input() outcome: LessonOutcome;

  constructor(
    readonly assessmentsService: AssessmentsService
  ) {}
}
