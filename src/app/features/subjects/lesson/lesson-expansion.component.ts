import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {shareReplay} from 'rxjs/operators';
import {LessonSchema} from '../../../common/model-types/subjects';
import {LessonState} from './lesson-state';
import {Observable, Unsubscribable} from 'rxjs';
import {ChangeCompletionStateEvent} from './prelearning-result-item.component';
import {LessonOutcomeSelfAssessmentReport} from '../../../common/model-types/assessment-reports';


@Component({
  selector: 'subjects-lesson-expansion',
  template: `
  <ng-container *ngIf="lesson$ | async as lesson">
    <mat-tab-group>
      <mat-tab label="Prelearning">
        <subjects-lesson-prelearning-results
            [report]="prelearningReport$ | async"
            [assessments]="prelearningAssessments$ | async"
            (completionStateChange)="changePrelearningCompletionState($event)">
        </subjects-lesson-prelearning-results>
      </mat-tab>
      <mat-tab label="Student outcomes" class="d-flex">
        <div class="outcomes-content d-flex">
          <div class="outcomes-overview flex-grow-1">
            <h4>Overview</h4>
          </div>
          <div class="outcome-details flex-grow-2">
            <div *ngFor="let outcome of lesson.outcomes">
              <subjects-lesson-outcome-self-assessment-report
                [outcome]="outcome"
                [reports]="outcomeSelfAssessmentReports$ | async">
              </subjects-lesson-outcome-self-assessment-report>
            </div>
          </div>
        </div>
      </mat-tab>
    </mat-tab-group>
  </ng-container>
  `,
  styles: [`
    .d-flex {
      display: flex;
    }

    .outcomes-overview {
      flex-basis: 33%;
    }

    .outcome-details {
      flex-basis: 66%;
    }

    .flex-grow-1 {
      flex-shrink: 0;
      flex-grow: 1;
    }
    .flex-grow-2 {
      flex-grow: 2;
    }

    .outcomes-content {
      margin-top: 2rem;
    }
  `],
  providers: [
    LessonState
  ]
})
export class LessonExpansionComponent implements OnInit, OnDestroy {
  private resources: Unsubscribable[] = [];

  @Input() lesson: LessonSchema | undefined;

  readonly lesson$ = this.lessonState.lesson$.pipe(
    shareReplay(1)
  );
  readonly prelearningReport$ = this.lessonState.prelearningReport$.pipe(
    shareReplay(1)
  );
  readonly prelearningAssessments$ = this.lessonState.prelearningAssessments$.pipe(
    shareReplay(1)
  );
  readonly outcomeSelfAssessmentReports$: Observable<{[k: string]: LessonOutcomeSelfAssessmentReport}> = this.lessonState.outcomeSelfAssessmentReports$.pipe(
    shareReplay(1)
  );

  constructor(
    readonly lessonState: LessonState
  ) {}

  ngOnInit() {
    this.resources.push(this.lessonState.init());

    this.resources.push(this.prelearningReport$.subscribe(report => {
      report.candidates.forEach(candidateId => {
        this.lessonState.loadPrelearningAssessment(candidateId);
      })
    }))
  }

  ngOnDestroy() {
    this.resources.forEach(r => r.unsubscribe());
  }

  async changePrelearningCompletionState(evt: ChangeCompletionStateEvent) {
    await this.lessonState.setPrelearningAssessmentCompletionState(evt.student, evt.completionState);
  }

}
