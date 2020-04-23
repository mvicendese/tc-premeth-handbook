import {Component, Input} from '@angular/core';
import {LessonPrelearningReport} from '../../../common/model-types/assessment-reports';
import {LessonState} from './lesson-state';
import {map, shareReplay} from 'rxjs/operators';
import {combineLatest} from 'rxjs';


@Component({
  selector: 'subjects-lesson-prelearning-tab',
  template: `
    <ng-container *ngIf="displayLesson$ | async as view">
      <subjects-prelearning-overview [lesson]="view.lesson" [report]="view.report">
      </subjects-prelearning-overview>
      <mat-divider vertical></mat-divider>
      <subjects-lesson-prelearning-results [lesson]="view.lesson" [report]="view.report">
      </subjects-lesson-prelearning-results>
    </ng-container>
  `,
  styles: [`
    :host {
      display: flex;
    }
    
    subjects-prelearning-overview {
      flex-basis: 33%;
      margin-left: 1rem;
    }
    
    subjects-lesson-prelearning-results {
      flex-basis: 66%;
    }
  `]
})
export class LessonPrelearningTabComponent {
  readonly lesson$ = this.lessonState.lesson$.pipe(
    shareReplay(1)
  );

  readonly prelearningReport$ = this.lessonState.lessonPrelearningReport$;

  readonly displayLesson$ = combineLatest([
    this.lesson$,
    this.prelearningReport$
  ]).pipe(
    map(([lesson, report]) => ({lesson, report}))
  );

  constructor(
    readonly lessonState: LessonState
  ) {}
}
