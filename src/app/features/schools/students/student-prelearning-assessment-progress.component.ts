import {Component, Input} from '@angular/core';
import {LessonPrelearningAssessmentProgress} from '../../../common/model-types/assessment-progress';

@Component({
  selector: 'schools-student-prelearning-assessment-progress',
  template: `
  `
})
export class StudentPrelearningAssessmentProgressComponent {
  @Input() progress: LessonPrelearningAssessmentProgress;

}
