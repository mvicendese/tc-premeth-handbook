import {ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {LessonPrelearningReport} from '../../../common/model-types/assessment-reports';
import {ModelRef, Resolve} from '../../../common/model-base/model-ref';
import {AppStateService} from '../../../app-state.service';
import {LessonSchema} from '../../../common/model-types/subjects';
import {LessonPrelearningAssessment} from '../../../common/model-types/assessments';
import {ChangeCompletionStateEvent} from './prelearning-result-item.component';
import {LessonState} from './lesson-state';
import {BehaviorSubject, combineLatest, forkJoin} from 'rxjs';
import {filter, first, map, shareReplay, switchMap, tap} from 'rxjs/operators';
import {StudentContextService} from '../../schools/students/student-context.service';

@Component({
  selector: 'subjects-lesson-prelearning-results',
  template: `
    <mat-list>
      <mat-list-item *ngFor="let assessment of displayAssessments$ | async">
        <subjects-lesson-prelearning-results-item
            [assessment]="assessment.assessment"
            (completionStateChange)="completionStateChange.emit($event)">
        </subjects-lesson-prelearning-results-item>
      </mat-list-item>
    </mat-list>
  `,
  styles: [`
    :host mat-list-item.hidden {
      display: none;
    }
    .complete-col > button {
      width: 100%;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrelearningResultComponent {

  @Input() lesson: LessonSchema | undefined;
  @Output() completionStateChange = new EventEmitter<ChangeCompletionStateEvent>();

  readonly displayAssessments$ = combineLatest([
    this.lessonState.lessonPrelearningReport$,
    this.lessonState.prelearningAssessments$
  ]).pipe(
    tap(([report, _]) => console.log('report candidates', report.candidateCount)),
    switchMap(([report, assessments]) =>
      forkJoin(
        report.candidates.map(candidate => {
          const assessment = assessments[ModelRef.id(candidate)];

          return this.studentContext.student(candidate).pipe(
            first(),
            map((student) => ({
              report: report,
              student: assessment.student,
              assessment: {...assessment, student: student}
            }))
          );
        })
      )
    ),
    shareReplay(1)
  );


  constructor(
    readonly lessonState: LessonState,
    readonly studentContext: StudentContextService,
    readonly appState: AppStateService,
    protected readonly cd: ChangeDetectorRef
  ) {}
}
