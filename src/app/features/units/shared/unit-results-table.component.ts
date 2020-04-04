import {Component, Input, OnDestroy} from '@angular/core';
import {BehaviorSubject, defer, Observable} from 'rxjs';
import {first, map, pluck, shareReplay} from 'rxjs/operators';
import {Student} from '../../../common/model-types/schools';
import {Unit} from '../../../common/model-types/subjects';

interface TableState {
  readonly students: Student[];
  readonly unit: Unit | null;
  readonly studentResults: {[studentId: string]: any};
}

export interface TableRowData {
  readonly student: Student;
  readonly unit: Unit;
  readonly unitResult: any | null;
}
export function tableRows(state: TableState): TableRowData[] {
  if (state.unit == null) {
    return [];
  }
  return state.students.map(student => ({
    student,
    unit: state.unit,
    unitResult: state.studentResults[student.id] || null
  }));
}

@Component({
  selector: 'app-unit-results-table',
  template: `
    <ng-container *ngIf="unit$ | async as unit">

      <table mat-table [dataSource]="tableRows$">
        <ng-container matColumnDef="date">
          <th mat-header-cell *matHeaderCellDef>Date</th>
          <td mat-cell *matCellDef="let element">
            {{element.unitResult.date | date }}
          </td>
        </ng-container>

        <ng-container matColumnDef="student">
          <th mat-header-cell *matHeaderCellDef>Student</th>
          <td mat-cell *matCellDef="let element">
            <a [routerLink]="['/students', element.student.id]">{{element.student.fullName}}</a>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="tableColumns"></tr>
        <tr mat-row *matRowDef="let row: columns: tableColumns"></tr>
      </table>
    </ng-container>
  `
})
export class UnitResultsTableComponent implements OnDestroy {
  readonly tableColumns = ['date', 'student'];

  private readonly stateSubject = new BehaviorSubject<TableState>({
    students: [],
    unit: null,
    studentResults: {}
  });

  @Input()
  set students(students: Student[]) {
    this.stateSubject.next({...this.stateSubject.value, students});
  }

  @Input()
  set studentResults(studentResults: {[studentId: string]: any}) {
    this.stateSubject.next({...this.stateSubject.value, studentResults});
  }

  @Input()
  set unit(unit: Unit | null) {
    this.stateSubject.next({...this.stateSubject.value, unit});
  }

  readonly unit$ = this.stateSubject.pipe(
    pluck('unit'),
    shareReplay(1)
  );

  readonly tableRows$ = this.stateSubject.pipe(
    map(state => tableRows(state)),
    shareReplay(1)
  );

  ngOnDestroy(): void {
    this.stateSubject.complete();
  }
}



