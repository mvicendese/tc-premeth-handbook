import {Component, Input, OnInit} from '@angular/core';
import {LessonOutcomeSelfAssessmentProgress} from '../../../../common/model-types/assessment-progress';
import {LessonOutcomeSelfAssessment} from '../../../../common/model-types/assessments';
import {StudentState} from '../student-state';
import {Unsubscribable} from 'rxjs';

@Component({
  selector: 'schools-student-progress-lesson-outcome-self-assessment-tab',
  template: `
    <ng-container *ngIf="progress">
      <dl>
        <dt>Number of ratings</dt>
        <dd>{{progress.attemptedAssessmentCount}}</dd>
      </dl>
    </ng-container>
  `,
  styleUrls: [
    'lesson-outcome-self-assessment-tab.component.scss'
  ]
})
export class LessonOutcomeSelfAssessmentTabComponent implements OnInit {
  @Input() progress: LessonOutcomeSelfAssessmentProgress | null;

  constructor(readonly studentState: StudentState) {}

  ngOnInit() {
    this.studentState.loadProgressSubject.next('lesson-outcome-self-assessment');
  }
}
