import {Component, Input} from '@angular/core';
import {LessonSchema} from '../../../common/model-types/subjects';


@Component({
  selector: 'app-lesson-outcomes',
  template: `
  <ul>
    <li *ngFor="let outcome of lesson.lessonoutcomes">
      <span>{{outcome.description}}</span>
    </li>
  </ul>
  `
})
export class LessonOutcomesComponent {
  @Input() lesson: LessonSchema;

}
