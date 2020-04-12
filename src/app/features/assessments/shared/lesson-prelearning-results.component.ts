import {ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {first, shareReplay, startWith, tap} from 'rxjs/operators';
import {LessonOutcomeSelfAssessmentReport, LessonPrelearningReport} from '../../../common/model-types/assessment-reports';
import {ModelRef, modelRefId, Resolve} from '../../../common/model-base/model-ref';
import {AppStateService} from '../../../app-state.service';
import {LessonSchema} from '../../../common/model-types/subjects';
import {Assessment, LessonOutcomeSelfAssessment, LessonPrelearningAssessment} from '../../../common/model-types/assessments';
import {Student} from '../../../common/model-types/schools';
import {LessonStateService} from '../../units/lesson-state.service';
import {CreateCompileFn} from '@angular/compiler-cli/ngcc/src/execution/api';
import {ChangeCompletionStateEvent} from './prelearning-assessment-item.component';

@Component({
  selector: 'app-lesson-prelearning-results',
  template: `
    <div class="report-container" *ngIf="report">
      <dl>
        <dt>Students Complete</dt>
        <dd>
          {{report.completedCandidateCount}} / {{report.totalCandidateCount}}
          <span class="percentage">{{report.percentCompleted}}
          </span>
        </dd>
      </dl>
      <form class="table-controls" [formGroup]="controlsForm">
        <mat-checkbox formControlName="hideComplete">Hide if prelearning complete</mat-checkbox>
      </form>
    </div>

    <mat-divider vertical></mat-divider>

    <div class="assessments-container" [formGroup]="controlsForm">
      <mat-list *ngIf="report">
        <mat-list-item *ngFor="let candidateId of report.candidateIds;"
                       [class.hidden]="hideComplete && assessments[candidateId]?.isComplete">
          <ass-prelearning-assessment-item
            [assessment]="assessments[candidateId]"
            (completionStateChange)="completionStateChange.emit($event)">
          </ass-prelearning-assessment-item>
        </mat-list-item>
      </mat-list>
    </div>
    <ng-template #noStudent>>< STUDENT MISSING ></ng-template>
  `,
  styles: [`
    :host {
      display: flex;
    }
    :host .report-container {
      flex-grow: 1;
    }
    :host .assessments-container {
      flex-grow: 2;
    }

    :host mat-list-item.hidden {
      display: none;
    }

    .complete-col > button {
      width: 100%;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LessonPrelearningResultsComponent {

  @Input() lesson: LessonSchema | undefined;

  @Input() report: LessonPrelearningReport | undefined;
  @Input() assessments: {[candidateId: string]: Resolve<LessonPrelearningAssessment, 'student'>} = {};

  @Output() completionStateChange = new EventEmitter<ChangeCompletionStateEvent>();

  readonly controlsForm = new FormGroup({
    hideComplete: new FormControl(true)
  });

  get hideComplete() {
    return this.controlsForm.value.hideComplete;
  }

  constructor(
    protected readonly appState: AppStateService,
    protected readonly cd: ChangeDetectorRef
  ) {}
}
