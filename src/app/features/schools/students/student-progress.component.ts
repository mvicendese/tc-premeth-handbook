import {Component, Inject, Injectable, InjectionToken, Input} from '@angular/core';
import {Student} from '../../../common/model-types/schools';
import {Progress} from '../../../common/model-types/assessment-progress';
import {Resolve} from '../../../common/model-base/model-ref';
import {defer, Observable, Observer} from 'rxjs';
import {AssessmentQuery} from '../../../common/model-services/assessments.service';
import {Assessment} from '../../../common/model-types/assessments';

export const ASSESSMENT_CONTEXT = new InjectionToken<AssessmentContext>('ASSESSMENT_CONTEXT');

export interface AssessmentContext {
  readonly query: Observer<AssessmentQuery>;
  readonly assessments$: Observable<{[assessmentId: string]: Assessment}>;
}


@Component({
  selector: 'student-progress-component',
  template: `

  `,
  styles: [`
  `]
})
export class StudentProgressComponent {
  @Input() progress: Resolve<Progress, 'student' | 'node'> | undefined;

  readonly assessments$ = defer(() => this.assessmentContext.assessments$);

  constructor(
    @Inject(ASSESSMENT_CONTEXT)
    readonly assessmentContext: AssessmentContext
  ) {}

}
