import {ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {first, shareReplay, startWith, tap} from 'rxjs/operators';
import {LessonPrelearningReport} from '../../../common/model-types/assessment-reports';
import {ResponsePage} from '../../../common/model-base/pagination';
import {StudentService} from '../../../common/model-services/students.service';
import {Observable} from 'rxjs';
import {ModelRef} from '../../../common/model-base/model-ref';
import {AppStateService} from '../../../app-state.service';
import {LessonSchema} from '../../../common/model-types/subjects';
import {LessonPrelearningAssessment} from '../../../common/model-types/assessments';
import {Student} from '../../../common/model-types/schools';

@Component({
  selector: 'app-lesson-prelearning-results',
  template: `
    <div class="prelearning-assessment-aggregates" *ngIf="report">
      <dl>
        <dt>Students Complete</dt>
        <dd>
          {{report.completedCandidateCount}} / {{report.totalCandidateCount}}
          <span class="percentage">{{report.percentageComplete}}
          </span>
        </dd>
      </dl>
    </div>

    <div class="prelearning-assessment-students" [formGroup]="controlsForm">
      <mat-checkbox formControlName="hideComplete">Hide if prelearning complete</mat-checkbox>

      <mat-list>
        <mat-list-item *ngFor="let assessment of (assessments?.results || [])"
                       [class.hidden]="hideComplete && assessment.isCompleted">
          <div class="complete-col">
            <ng-container *ngIf="assessment.isCompleted; then completeAssessmentButton; else clearAssessmentButton">
            </ng-container>

            <ng-template #completeAssessmentButton>
              <button mat-raised-button color="primary">
                <mat-icon>check</mat-icon>
              </button>
            </ng-template>

            <ng-template #clearAssessmentButton>
              <button mat-raised-button color="warn" (click)="completeAssessment(assessment)">
                <mat-icon>clear</mat-icon>
              </button>
            </ng-template>
          </div>

          <div class="student-col">
            <span *ngIf="students[assessment.student] as student; else noStudent">
              {{student.fullName}}
            </span>
          </div>
          <div class="completion-date-col">
            <span *ngIf="assessment.isCompleted">
              On: <span class="date">{{assessment.attemptedAt | date}}</span>
            </span>
          </div>
          <div class="clear-completion-col">
              <button *ngIf="assessment.isCompleted" mat-button color="warn">
                CLEAR
              </button>
          </div>
        </mat-list-item>
      </mat-list>
    </div>

    <ng-template #noStudent>>< STUDENT MISSING ></ng-template>
  `,
  styles: [`
    mat-list-item.hidden {
      display: none;
    }

    .student-col {
      flex-grow: 1;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LessonPrelearningResultsComponent implements OnChanges {
  readonly visibleColumns = ['name'];

  @Input() lesson: LessonSchema | undefined;

  @Input() report: LessonPrelearningReport | undefined;
  @Input() assessments: ResponsePage<LessonPrelearningAssessment>;

  @Output() markCompleted = new EventEmitter<[ModelRef<LessonPrelearningAssessment>, boolean]>();

  readonly students: {[k: string]: Student} = {};

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

  ngOnChanges(changes: SimpleChanges) {
    if (changes.assessments && changes.assessments.currentValue) {
      const assessments = changes.assessments.currentValue;
      const studentRefs = new Set<ModelRef<Student>>(
        assessments.results.map(assessment => assessment.student)
      );
      for (const ref of studentRefs) {
        this.appState.loadStudent(ref).pipe(first()).subscribe(student => {
          this.students[student.id] = student;
        });
      }

    }
  }

  completeAssessment(assessment: LessonPrelearningAssessment) {
    this.markCompleted.emit([assessment, true]);
  }

  clearCompletion(assessment: LessonPrelearningAssessment) {
    this.markCompleted.emit([assessment, false]);
  }
}
