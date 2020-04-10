import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {AppStateService} from '../../../app-state.service';
import {mark} from '@angular/compiler-cli/src/ngtsc/perf/src/clock';
import {BehaviorSubject, combineLatest, concat, Observable, of, Subscription, zip} from 'rxjs';
import {concatMap, filter, first, map, shareReplay, switchMap} from 'rxjs/operators';
import {Subject, Unit} from '../../../common/model-types/subjects';
import {Student} from '../../../common/model-types/schools';

interface TableState {
  readonly subject: Subject;
  readonly student: Student;
  readonly subjectResult: any;
}

export function isTableState(obj: Partial<TableState>): obj is TableState {
  return obj.subject != null
      && obj.subjectResult != null
      && obj.student != null;
}


interface TableRowData {
  readonly unit: Unit;
  readonly student: Student;
  readonly result: any;
}

export function tableDatas(state: Partial<TableState>): TableRowData[] {
  if (!isTableState(state)) {
    return [];
  }
  const units = state.subject.units;
  return units.map(unit => ({
    unit,
    student: state.student,
    result: state.subjectResult.units[unit.id]
  }));
}


@Component({
  selector: 'app-students-unit-results-table',
  template: `
    <table mat-table [dataSource]="tableData$ | async">
      <ng-container matColumnDef="name">
         <th mat-header-cell *matHeaderCellDef>Unit</th>
         <td mat-cell *matCellDef="let element">{{element.unit.name}}</td>
      </ng-container>

      <ng-container matColumnDef="date">
        <th mat-header-cell *matHeaderCellDef>Date</th>
        <td mat-cell *matCellDef="let element">{{element.result.date}}</td>
      </ng-container>

       <ng-container matColumnDef="mark">
        <th mat-header-cell *matHeaderCellDef>Mark</th>
        <td mat-cell *matCellDef="let element">{{element.result.markPercent}}</td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="tableColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: tableColumns"></tr>
    </table>
  `
})
export class UnitResultsTableComponent {
  private subscriptions: Subscription[];

  private stateSubject = new BehaviorSubject<Partial<TableState>>({});

  @Input()
  set student(student: Student) {
    this.stateSubject.next({...this.stateSubject.value, student});
  }

  @Input()
  set subject(subject: Subject) {
    this.stateSubject.next({...this.stateSubject.value, subject});
  }

  @Input()
  set subjectResult(subjectResult) {
    this.stateSubject.next({...this.stateSubject.value, subjectResult});
  }

  readonly tableColumns = ['date', 'name', 'mark'];

  readonly tableData$ = this.stateSubject.pipe(
    map(state => tableDatas(state)),
    shareReplay(1)
  );

  constructor(
  ) {}

}
