import {ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {LessonPrelearningReport} from '../../../common/model-types/assessment-reports';
import {Resolve} from '../../../common/model-base/model-ref';
import {AppStateService} from '../../../app-state.service';
import {LessonSchema} from '../../../common/model-types/subjects';
import {LessonPrelearningAssessment} from '../../../common/model-types/assessments';
import {ChangeCompletionStateEvent} from './prelearning-result-item.component';

@Component({
  selector: 'subjects-lesson-prelearning-results',
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
          <subjects-lesson-prelearning-results-item
            [assessment]="assessments[candidateId]"
            (completionStateChange)="completionStateChange.emit($event)">
          </subjects-lesson-prelearning-results-item>
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
export class PrelearningResultComponent {

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
