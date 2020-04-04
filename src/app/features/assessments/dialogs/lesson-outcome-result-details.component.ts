import {Component, Input} from '@angular/core';
import {LessonOutcome} from '../../../common/model-types/subjects';
import {ResponsePage} from '../../../common/model-base/pagination';
import {LessonOutcomeSelfAssessment} from '../../../common/model-types/assessments';

@Component({
  selector: 'app-lesson-outcome-result-details-dialog',
  template: `
  `
})
export class LessonOutcomeResultDetailsDialogComponent {
  @Input()
  outcome: LessonOutcome;

  @Input()
  assessments: ResponsePage<LessonOutcomeSelfAssessment>;
}
