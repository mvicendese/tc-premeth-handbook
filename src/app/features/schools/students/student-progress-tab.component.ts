import {Component, Inject, Injectable, InjectionToken, Input} from '@angular/core';
import {Student} from '../../../common/model-types/schools';
import {CompletionBasedProgress, Progress} from '../../../common/model-types/assessment-progress';
import {Resolve} from '../../../common/model-base/model-ref';
import {defer, Observable, Observer} from 'rxjs';
import {AssessmentQuery} from '../../../common/model-services/assessments.service';
import {Assessment} from '../../../common/model-types/assessments';
import {StudentState} from './student-state';
import {shareReplay} from 'rxjs/operators';



@Component({
  selector: 'schools-student-progress',
  template: `
    <dl>
      <dt>Prelearning</dt>
      <dd>
        <ng-container *ngIf="prelearningProgress$ | async as prelearningProgress">
          <schools-student-prelearning-assessment-progress
            [progress]="prelearningProgress">
          </schools-student-prelearning-assessment-progress>
        </ng-container>
      </dd>

      <dt>Lesson outcomes</dt>
      <dd *ngIf="lessonOutcomeSelfAssessmentProgress$ | async as selfAssessmentProgress">
        <schools-student-lesson-outcome-self-assessment-progress
              [progress]="selfAssessmentProgress">
        </schools-student-lesson-outcome-self-assessment-progress>
      </dd>

    </dl>

  `,
  styles: [`
  `]
})
export class StudentProgressTabComponent {
  readonly prelearningProgress$ = this.state.lessonPrelearningAssessmentProgress$.pipe(
    shareReplay(1)
  );

  readonly lessonOutcomeSelfAssessmentProgress$ = this.state.lessonOutcomeSelfAssessmentProgress$.pipe(
    shareReplay(1)
  );

  constructor(
    readonly state: StudentState
  ) {}

}
