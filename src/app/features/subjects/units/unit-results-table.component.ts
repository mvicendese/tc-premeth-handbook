import {Component, Injectable, OnDestroy, OnInit} from '@angular/core';
import {UnitState} from './unit-state';
import {BehaviorSubject, forkJoin, Observable, of, Subject, Unsubscribable} from 'rxjs';
import {UnitAssessment} from '../../../common/model-types/assessments';
import {Student} from '../../../common/model-types/schools';
import {first, map, multicast, switchMap, withLatestFrom} from 'rxjs/operators';
import {MatTableDataSource} from '@angular/material/table';
import {StudentContextService} from '../../schools/students/student-context.service';
import {DomSanitizer} from '@angular/platform-browser';


interface UnitAssessmentTableState {
  readonly columns: string[];
  readonly compare: (a: UnitAssessmentTableItem, b: UnitAssessmentTableItem) => number;
  readonly items: UnitAssessmentTableItem[];
}

interface UnitAssessmentTableItem {
  readonly student: Student;
  readonly assessment: UnitAssessment | undefined;
}

export class UnitResultsTableDataSource extends MatTableDataSource<UnitAssessmentTableItem> {
  private resources: Unsubscribable[] = [];

  constructor(
    readonly unitState: UnitState
  ) {
    super();
  }

  protected createTableItem(studentId: string, assessment: UnitAssessment | undefined): Observable<UnitAssessmentTableItem> {
    return this.unitState.getStudent(studentId).pipe(
      map(student => ({assessment, student})),
      first()
    );
  }

  connect(): BehaviorSubject<UnitAssessmentTableItem[]> {
    const subject = new BehaviorSubject<UnitAssessmentTableItem[]>([]);

    this.resources.push(this.unitState.unitAssessments$.pipe(
      switchMap((studentAssessments: { [studentId: string]: UnitAssessment }) => {
        const assessments = Object.entries(studentAssessments);
        return forkJoin(assessments.map(([studentId, assessment]) => this.createTableItem(studentId, assessment)));
      })
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
  template: `
    <table mat-table [dataSource]="dataSource">

      <ng-container matColumnDef="student">
        <th mat-header-cell *matHeaderCellDef> Student </th>
        <td mat-cell *matCellDef="let item">
          <a mat-button [routerLink]="['/students', item.student.id]">{{item.student.fullName}}</a>
        </td>
      </ng-container>

      <ng-container matColumnDef="is-attempted">
        <th mat-header-cell *matHeaderCellDef> Attempted </th>
        <td mat-cell *matCellDef="let item">
          <mat-icon *ngIf="item.assessment != null; else notAttempted">done</mat-icon>
          <ng-template #notAttempted>
            <mat-icon>close</mat-icon>
          </ng-template>
        </td>
      </ng-container>

      <ng-container matColumnDef="date">
        <th mat-header-cell *matHeaderCellDef> Date </th>
        <td mat-cell *matCellDef="let item">
          <ng-container *ngIf="item.assessment != null">
            {{item.assessment.attemptedAt | date }}
          </ng-container>
        </td>
      </ng-container>

      <ng-container matColumnDef="mark">
        <th mat-header-cell *matHeaderCellDef> Mark </th>
        <td mat-cell *matCellDef="let item">
          <ng-container *ngIf="item.assessment != null">
            {{ item.assessment.rating }} / {{ item.assessment.maxAvailableRating }}
          </ng-container>
        </td>
      </ng-container>

      <ng-container matColumnDef="mark-percent">
        <th mat-header-cell *matHeaderCellDef> Mark Percent</th>
        <td mat-cell *matCellDef="let item">
          <ng-container *ngIf="item.assessment != null">
            {{ item.assessment.ratingPercent }}
          </ng-container>
        </td>
      </ng-container>

      <ng-container matColumnDef="comment">
        <th mat-header-cell *matHeaderCellDef> Comment </th>
        <td mat-cell *matCellDef="let item">
          <ng-container *ngIf="item.assessment != null && item.assessment.comments.length">
            <!--
            -->
          </ng-container>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="state.value.columns"></tr>
      <tr mat-row *matRowDef="let row; columns: state.value.columns;"></tr>
    </table>
  `,
  styleUrls: [
    './unit-results-table.component.scss'
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

  readonly state = new BehaviorSubject<UnitAssessmentTableState>({
    columns: ['student', 'is-attempted', 'date', 'mark', 'mark-percent', 'comment'],
    compare: UnitResultsTableComponent.defaultCompare,
    items: []
  });

  readonly dataSource = new UnitResultsTableDataSource(
    this.unitState
  );

  constructor(
    readonly unitState: UnitState,
    readonly domSanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.state.subscribe();
  }

  ngOnDestroy() {
    this.state.complete();
  }

}
