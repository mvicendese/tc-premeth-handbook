import {Component, Input} from '@angular/core';
import {LessonOutcomeSelfAssessmentProgress} from '../../../common/model-types/assessment-progress';

@Component({
  selector: 'schools-student-lesson-outcome-self-assessment-progress',
  template: `

  `
})
export class StudentLessonOutcomeSelfAssessmentProgressComponent {
  @Input() progress: LessonOutcomeSelfAssessmentProgress;
}
