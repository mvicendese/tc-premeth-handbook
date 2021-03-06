import {Component, EventEmitter, Injectable, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {Assessment, CompletionState, LessonPrelearningAssessment} from '../../../common/model-types/assessments';
import {LessonState} from './lesson-state';
import {AppStateService} from '../../../app-state.service';
import {FormArray, FormControl, FormGroup} from '@angular/forms';
import {MatButtonToggleChange} from '@angular/material/button-toggle';
import {Student} from '../../../common/model-types/schools';
import {Ref} from '../../../common/model-base/ref';

export interface ChangeCompletionStateEvent {
  readonly student: Ref<Student>;
  readonly assessment: Ref<Assessment>;
  readonly completionState: CompletionState;
}

@Component({
  selector: 'subjects-lesson-prelearning-results-item',
  template: `
  <div class="indicator-col">
    <ng-container *ngIf="_isLoading; then loadingIndicator; else trafficIndicator"></ng-container>

    <ng-template #loadingIndicator>
      <app-loading size="inline"></app-loading>
    </ng-template>

    <ng-template #trafficIndicator>
      <app-traffic-light [value]="trafficValue"></app-traffic-light>
    </ng-template>
  </div>
  <ng-container *ngIf="assessment">
    <div class="student-col">
      <schools-student-item [student]="assessment.student"></schools-student-item>
    </div>
    <div class="completion-date-col">
      <span *ngIf="assessment.isComplete">
        On: <span class="date">{{assessment.attemptedAt | date}}</span>
      </span>
    </div>
    <div class="complete-col">
      <mat-button-toggle-group multiple>
        <mat-button-toggle class="dna-toggle"
                           [checked]="assessment.completionState === 'none'"
                           (change)="markCompletionState($event, 'none')">
          <mat-icon>error_outline</mat-icon> Did not attempt
        </mat-button-toggle> 
        <mat-button-toggle class="attempt-toggle"
                           [checked]="assessment.completionState === 'partially-complete'"
                           (change)="markCompletionState($event, 'partially-complete')">
          <mat-icon>done</mat-icon> made attempt
        </mat-button-toggle>
        <mat-button-toggle class="complete-toggle"
                           [checked]="assessment.completionState === 'complete'"
                           (change)="markCompletionState($event, 'complete')">
          <mat-icon>done_all</mat-icon>complete
        </mat-button-toggle>
      </mat-button-toggle-group>
    </div>


  </ng-container>
  `,
  styles: [`
    :host {
      display: flex;
      width: 100%;
      line-height: 36px !important;
    }

    :host ::ng-deep .mat-button-toggle-appearance-standard .mat-button-toggle-label-content {
      line-height: 36px;
    }

    .indicator-col {
      padding: 0 3px;
      margin-right: 1rem;
    }

    .student-col {
      flex-grow: 1;
    }
  `]
})
export class PrelearningResultItemComponent implements OnChanges {
  _isLoading = true;

  @Input() assessment: LessonPrelearningAssessment;
  @Output() completionStateChange = new EventEmitter<ChangeCompletionStateEvent>();

  get trafficValue() {
    if (!(this.assessment && this.assessment.isAttempted)) {
      // The assessment hasn't been created yet.
      return 'indeterminate';
    }
    switch (this.assessment.completionState) {
      case 'none':
        return 'stop';
      case 'partially-complete':
        return 'wait';
      case 'complete':
        return 'go';
    }

  }

  constructor(
    readonly appState: AppStateService,
    readonly lessonState: LessonState
  ) {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.assessment && changes.assessment.currentValue) {
      this._isLoading = false;
    }
  }

  markCompletionState($event: MatButtonToggleChange, completionState: CompletionState) {
    this._isLoading = true;
    this.completionStateChange.emit({
      student: this.assessment.student,
      assessment: this.assessment,
      completionState
    });
  }
}
