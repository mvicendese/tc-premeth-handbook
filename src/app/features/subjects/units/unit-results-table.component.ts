import {Component, Injectable, OnDestroy, OnInit, ViewRef} from '@angular/core';
import {UnitState} from './unit-state';
import {BehaviorSubject, combineLatest, forkJoin, Observable, of, Subject, Unsubscribable, zip} from 'rxjs';
import {Assessment, UnitAssessment} from '../../../common/model-types/assessments';
import {Student, SubjectClass} from '../../../common/model-types/schools';
import {concatMapTo, first, map, multicast, pluck, switchMap, withLatestFrom} from 'rxjs/operators';
import {MatTableDataSource} from '@angular/material/table';
import {StudentContextService} from '../../schools/students/student-context.service';
import {DomSanitizer} from '@angular/platform-browser';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {AssessmentsModelApiService} from '../../../common/model-services/assessments.service';
import {provideCommentableService} from '../../base/comment/comment.model';
import {ref, Ref} from '../../../common/model-base/ref';
import {TrafficIndicatorValue} from '../../../common/components/traffic-light.component';


interface UnitAssessmentTableState {
  readonly columns: string[];
  readonly compare: (a: UnitAssessmentTableItem, b: UnitAssessmentTableItem) => number;
  readonly items: UnitAssessmentTableItem[];
  readonly expandedRowStudentId: string | null;
}

interface UnitAssessmentTableItem {
  readonly student: Student;
  readonly studentClass: Ref<SubjectClass>;

  readonly assessment: UnitAssessment | undefined;
  readonly trafficValue: TrafficIndicatorValue | null;

  readonly isAttempted: boolean;

  readonly formGroup: FormGroup | undefined;
}

function trafficValueForGrade(grade: 'fail' | 'low-pass' | 'high-pass' | null): TrafficIndicatorValue {
  switch (grade) {
    case 'fail':
      return 'stop';
    case 'low-pass':
      return 'wait';
    case 'high-pass':
      return 'go';
    default:
      return 'indeterminate';

  }
}

export class UnitResultsTableDataSource extends MatTableDataSource<UnitAssessmentTableItem> {
  private resources: Unsubscribable[] = [];

  readonly editingStudents = new BehaviorSubject<{[studentId: string]: FormGroup | undefined}>({});

  constructor(
    readonly unitState: UnitState
  ) {
    super();
  }

  protected createTableItemFormGroup(studentId: string): FormGroup {
    return new FormGroup({
      date: new FormControl(new Date()),
      mark: new FormControl(0, {
        validators:  Validators.max(30 /* TODO max available mark */)
      }),
      comment: new FormControl(undefined)
    });
  }

  protected createTableItem(studentRef: Ref<Student>, assessment: UnitAssessment | undefined): Observable<UnitAssessmentTableItem> {
    if (assessment !== undefined && assessment.isAttempted) {
      this.toggleStudentIsEditing(studentRef, false);
    }

    return zip(this.unitState.getStudent(studentRef), this.unitState.getStudentClass(studentRef)).pipe(
      map(([student, studentClass]) => ({
        assessment,
        isAttempted: assessment && assessment.isAttempted || false,
        formGroup: this.editingStudents.value[student.id],
        student,
        studentClass,
        trafficValue: trafficValueForGrade(assessment && assessment.grade || null)
      })),
      first()
    );
  }

  toggleStudentIsEditing(student: Ref<Student>, isEditing: boolean): void {
    const students = Object.keys(this.editingStudents.value);
    if (isEditing && !students.includes(student.id)) {
      this.editingStudents.next({
        ...this.editingStudents.value,
        [student.id]: this.createTableItemFormGroup(student.id)
      })
    }

    if (!isEditing && students.includes(student.id)) {
      this.editingStudents.next({
        ...this.editingStudents.value,
        [student.id]: undefined
      });
    }
  }

  connect(): BehaviorSubject<UnitAssessmentTableItem[]> {
    const subject = new BehaviorSubject<UnitAssessmentTableItem[]>([]);

    this.resources.push(this.unitState.unitAssessments$.pipe(
      switchMap((studentAssessments: { [studentId: string]: UnitAssessment }) => {
        const assessments = Object.entries(studentAssessments);
        return combineLatest([
          this.editingStudents,
        ]).pipe(
          concatMapTo(
            forkJoin(assessments.map(([studentId, assessment]) => this.createTableItem(ref('student', studentId), assessment)))
          )
        );
      }),
    ).subscribe(subject));

    return subject;
  }

  disconnect() {
    this.resources.forEach(r => r.unsubscribe());
    this.resources = [];
  }
}


@Component({
  selector: 'subjects-unit-results-table',
  templateUrl: './unit-results-table.component.html',
  styleUrls: [ './unit-results-table.component.scss' ],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ])
  ],
  providers: [
    provideCommentableService<Assessment, AssessmentsModelApiService>(AssessmentsModelApiService)
  ]
})
export class UnitResultsTableComponent implements OnInit, OnDestroy {
  static defaultCompare(a: UnitAssessmentTableItem, b: UnitAssessmentTableItem) {
    if (a.assessment == null) {
      return -1;
    }
    if (b.assessment == null) {
      return 1;
    }
    return a.assessment.id.localeCompare(b.assessment.id);
  };

  readonly commentControl = new FormControl();

  readonly state = new BehaviorSubject<UnitAssessmentTableState>({
    columns: ['grade', 'student', 'date', 'mark', 'comment', 'actions'],
    compare: UnitResultsTableComponent.defaultCompare,
    items: [],
    expandedRowStudentId: null
  });

  get expandedRowStudentId() {
    return this.state.value.expandedRowStudentId;
  }

  readonly dataSource = new UnitResultsTableDataSource(
    this.unitState
  );

  constructor(
    readonly unitState: UnitState,
    readonly domSanitizer: DomSanitizer,
    readonly viewRef: ViewRef
  ) {}

  ngOnInit() {
    console.log('viewRef', this.viewRef);
    this.state.subscribe();
  }

  ngOnDestroy() {
    this.state.complete();
  }

  beginCreateAssessment(student: Student) {
    this.dataSource.toggleStudentIsEditing(student, true);
  }

  expandComments(student: Ref<Student>) {
    // If clicking on the expanded row and it's open, hide it instead.
    if (student.id === this.expandedRowStudentId) {
      this.state.next({
        ...this.state.value,
        expandedRowStudentId: null
      });
    } else {
      this.state.next({
        ...this.state.value,
        expandedRowStudentId: student.id
      });
    }
  }

  isExpanded(student: Ref<Student>) {
    return this.state.value.expandedRowStudentId === student.id;
  }

}
