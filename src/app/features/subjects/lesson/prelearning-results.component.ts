import {ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {LessonPrelearningReport} from '../../../common/model-types/assessment-reports';
import {modelRefId, Resolve} from '../../../common/model-base/model-ref';
import {AppStateService} from '../../../app-state.service';
import {LessonSchema} from '../../../common/model-types/subjects';
import {LessonPrelearningAssessment} from '../../../common/model-types/assessments';
import {ChangeCompletionStateEvent} from './prelearning-result-item.component';
import {LessonState} from './lesson-state';
import {BehaviorSubject, combineLatest} from 'rxjs';
import {filter, map, shareReplay, switchMap} from 'rxjs/operators';

@Component({
  selector: 'subjects-lesson-prelearning-results',
  template: `
    <mat-list *ngIf="report">
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
  private readonly reportSubject = new BehaviorSubject<LessonPrelearningReport | undefined>(undefined);

  @Input() lesson: LessonSchema | undefined;

  @Input()
  get report(): LessonPrelearningReport | undefined {
    return this.reportSubject.value;
  }
  set report(value: LessonPrelearningReport | undefined) {
    this.reportSubject.next(value);
  }

  @Output() completionStateChange = new EventEmitter<ChangeCompletionStateEvent>();

  readonly displayAssessments$ = combineLatest([
    this.reportSubject.pipe(filter((report): report is LessonPrelearningReport => report != null)),
    this.lessonState.prelearningAssessments$
  ]).pipe(
    map(([report, assessments]) =>
      report.candidates.map(candidate => {
        const assessment = assessments[modelRefId(candidate)];

        return {
          report: report,
          student: assessment.student,
          assessment
        };
      })
    ),
    shareReplay(1)
  );


  constructor(
    readonly lessonState: LessonState,
    readonly appState: AppStateService,
    protected readonly cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (this.report == null) {
      throw new Error(`No report on init`);
    }
    this.report.candidates.forEach(candidate => this.lessonState.loadPrelearningAssessment(candidate).subscribe());
  }
}
