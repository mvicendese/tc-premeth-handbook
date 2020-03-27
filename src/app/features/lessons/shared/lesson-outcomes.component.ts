import {Component, Input} from '@angular/core';
import {LessonSchema} from '../../../common/model-types/lesson-schema';
import {LessonResult} from '../../../common/model-types/lesson-result';


@Component({
  selector: 'app-lesson-outcomes',
  template: `
  <ul>
    <li *ngFor="let outcome of lesson.outcomes">
      <span>{{outcome.description}}</span>
    </li>
  </ul>
  `
})
export class LessonOutcomesComponent {
  @Input() lesson: LessonSchema;
  @Input() lessonResult: LessonResult;



}
