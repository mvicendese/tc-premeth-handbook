import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {LessonSchema} from '../../../common/model-types/lesson-schema';
import {Student} from '../../../common/model-types/student';
import {FormControl, FormGroup} from '@angular/forms';
import {LessonPrelearningAssessment} from '../../../common/model-types/assessment';
import {first, shareReplay, startWith, tap} from 'rxjs/operators';
import {LessonPrelearningReport} from '../../../common/model-types/assessment-report';
import {ResponsePage} from '../../../common/model-base/pagination';
import {StudentService} from '../../../common/model-services/students.service';
import {Observable} from 'rxjs';
import {StudentContextService} from '../../students/student-context.service';
import {ModelRef} from '../../../common/model-base/model-ref';

@Component({
  selector: 'app-lesson-prelearning-results',
  template: `
    <div class="prelearning-assessment-aggregates" *ngIf="report">
      <dl>
        <dt>Students Complete</dt>
        <dd>
          {{report.studentsCompletedCount}} / {{report.count}}
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
          <div class="student-col">
            <span *ngIf="students[assessment.student] as student; else noStudent">
              {{student.fullName}}
            </span>
          </div>
          <div class="complete-col">
            <button disabled="assessment.isCompleted" mat-icon-button>
              <mat-icon>{{assessment.isCompleted ? 'check' : 'clear' }}</mat-icon>
            </button>
          </div>
          <div class="completion-date-col">
            On: <span class="date">{{assessment.completedAt | date}}</span>
          </div>
          <div class="clear-completion-col">
              <button *ngIf="assessment.isCompleted" mat-button color="warn">
                CLEAR
              </button>
          </div>
          <!--
          <ng-container *ngIf="as s; else noStudent">
            {{s.type}} - {{s.name}}
            <button mat-fab>
              <mat-icon>{{ assessment.isCompleted ? 'done' : 'clear' }}</mat-icon>
            </button>
          </ng-container>
          -->
        </mat-list-item>
      </mat-list>
    </div>

    <ng-template #noStudent>NO STUDENT</ng-template>
  `,
  styles: [`
    mat-list-item.hidden {
      display: none;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LessonPrelearningResultsComponent implements OnChanges {
  @Input() lesson: LessonSchema | undefined;

  @Input() report: LessonPrelearningReport | undefined;
  @Input() assessments: ResponsePage<LessonPrelearningAssessment>;

  readonly students: {[k: string]: Student} = {};

  readonly controlsForm = new FormGroup({
    hideComplete: new FormControl(true)
  });

  get hideComplete() {
    return this.controlsForm.value.hideComplete;
  }

  constructor(
    protected readonly cd: ChangeDetectorRef,
    readonly studentContext: StudentContextService,
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.assessments && changes.assessments.currentValue) {
      const assessments = changes.assessments.currentValue;
      const studentRefs = new Set<ModelRef<Student>>(
        assessments.results.map(assessment => assessment.student)
      );
      for (const ref of studentRefs) {
        this.studentContext.fetch(ref).subscribe(student => {
          this.students[student.id] = student;
          this.cd.markForCheck();
        });
      }
    }
  }


}
