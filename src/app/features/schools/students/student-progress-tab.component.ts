import {Component, Inject, Injectable, InjectionToken, Input} from '@angular/core';
import {Student} from '../../../common/model-types/schools';
import {Progress} from '../../../common/model-types/assessment-progress';
import {Resolve} from '../../../common/model-base/model-ref';
import {defer, Observable, Observer} from 'rxjs';
import {AssessmentQuery} from '../../../common/model-services/assessments.service';
import {Assessment} from '../../../common/model-types/assessments';
import {StudentState} from './student-state';



@Component({
  selector: 'schools-student-progress',
  template: `

  `,
  styles: [`
  `]
})
export class StudentProgressTabComponent {
  @Input() progress: Resolve<Progress, 'student' | 'node'> | undefined;

  constructor(
    readonly state: StudentState
  ) {}

}
