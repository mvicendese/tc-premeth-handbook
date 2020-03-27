import {Student} from '../../../common/model-types/student';
import {Unit} from '../../../common/model-types/unit';
import {StudentUnitTestResult} from '../../../common/model-types/student-unit-test-result';
import {Component, Input, OnDestroy} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {map, pluck, shareReplay} from 'rxjs/operators';
import {UnitBlock} from '../../../common/model-types/unit-block';
import {StudentBlockTestResult} from '../../../common/model-types/student-block-test-result';

interface TableState {
  readonly students: Student[];
  readonly unit: Unit | null;
  readonly block: UnitBlock | null;
  readonly studentResults: { [studentId: string]: StudentBlockTestResult[] };
}

export interface TableRowData {
  readonly student: Student;
  readonly unit: Unit;
  readonly block: UnitBlock;
  /** The maximum result out of any of the individual block tests */
  readonly maxBlockResult: StudentBlockTestResult | null;

  /** True if at least one attempt has been made at the block test. */
  readonly isAttempted: boolean;

  /** The total number of attempts made by the student */
  readonly numberOfAttempts: number;
}

function maxBlockResult(results: StudentBlockTestResult[]) {
  const resultsCopy = [...results];
  resultsCopy.sort((a, b) => b.markPercent - a.markPercent);
  return resultsCopy[0] || null;
}

function numberOfAttempts(results: StudentBlockTestResult[]) {
  return results.length;
}

export function tableRows(state: TableState): TableRowData[] {
  if (state.unit == null || state.studentResults == null) {
    return [];
  }
  return state.students.map(student => ({
    student,
    unit: state.unit,
    block: state.block,
    isAttempted: state.studentResults[student.id] != null && state.studentResults[student.id].length > 0,
    maxBlockResult: maxBlockResult(state.studentResults[student.id] || []),
    numberOfAttempts: numberOfAttempts(state.studentResults[student.id] || [])
  }))
    .filter(row => row.isAttempted);
}

@Component({
  selector: 'app-block-assessments-table',
  template: `
    <ng-container *ngIf="unit$ | async as unit">

      <table mat-table [dataSource]="tableRows$">
        <ng-container matColumnDef="date">
          <th mat-header-cell *matHeaderCellDef>Date</th>
          <td mat-cell *matCellDef="let element">
            {{element.maxBlockResult.date | date }}
          </td>
        </ng-container>

        <ng-container matColumnDef="student">
          <th mat-header-cell *matHeaderCellDef>Student</th>
          <td mat-cell *matCellDef="let element">
            <a [routerLink]="['/students', element.student.id]">{{element.student.fullName}}</a>
          </td>
        </ng-container>

        <ng-container matColumnDef="markPercent">
          <th mat-header-cell *matHeaderCellDef>Mark (%)</th>
          <td mat-cell *matCellDef="let element">
            {{element.maxBlockResult.markPercent | number:'1.0-0'}}

          </td>
        </ng-container>

        <ng-container matColumnDef="attempts">
          <th mat-header-cell *matHeaderCellDef>Attempts</th>
          <td mat-cell *matCellDef="let element">
            <span class="attempt-count">{{element.numberOfAttempts}}</span>
            <button mat-button>Show</button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="tableColumns"></tr>
        <tr mat-row *matRowDef="let row: columns: tableColumns"></tr>
      </table>
    </ng-container>

    <ng-template #notAttempted>
      not attempted
    </ng-template>
  `
})
export class BlockAssessmentsComponent implements OnDestroy {
  readonly tableColumns = ['date', 'student', 'markPercent', 'attempts'];

  private readonly stateSubject = new BehaviorSubject<TableState>({
    students: [],
    unit: null,
    block: null,
    studentResults: {}
  });

  @Input()
  set students(students: Student[]) {
    this.stateSubject.next({...this.stateSubject.value, students});
  }

  @Input()
  set studentResults(studentResults: {[studentId: string]: StudentBlockTestResult[] }) {
    this.stateSubject.next({...this.stateSubject.value, studentResults: studentResults || {}});
  }

  @Input()
  set unit(unit: Unit | null) {
    this.stateSubject.next({...this.stateSubject.value, unit});
  }

  @Input()
  set block(block: UnitBlock | null) {
    this.stateSubject.next({...this.stateSubject.value, block});
  }

  readonly unit$ = this.stateSubject.pipe(
    pluck('unit'),
    shareReplay(1)
  );

  readonly tableRows$ = this.stateSubject.pipe(
    map(state => tableRows(state)),
    map(rows => rows.filter(row => row.isAttempted)),
    shareReplay(1)
  );

  ngOnDestroy(): void {
    this.stateSubject.complete();
  }
}
