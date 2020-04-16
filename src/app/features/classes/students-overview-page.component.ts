import {Component, OnDestroy} from '@angular/core';
import {filter, first, map, pluck, shareReplay, startWith, switchMap, tap, withLatestFrom} from 'rxjs/operators';
import {BehaviorSubject, combineLatest, defer, Observable, Subscription} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {AppStateService} from '../../app-state.service';
import {modelRefId} from '../../common/model-base/model-ref';
import {Student, SubjectClass} from '../../common/model-types/schools';
import {FormControl} from '@angular/forms';
import {MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';

interface UnitResultTableRow {
  unitName: string;
  markPercent: number;
}

@Component({
  selector: 'app-students-overview-page',
  template: `
    <ng-container *ngIf="sortedStudents$ | async as students">
      <mat-form-field>
        Search
        <input type="text" matInput [formControl]="searchControl" [matAutocomplete]="auto">
      </mat-form-field>
      <mat-autocomplete #auto="matAutocomplete"
                        [displayWith]="_studentDisplay"
                        (optionSelected)="selectStudent($event)">
        <mat-option *ngFor="let student of students"
                    [value]="student">
          {{student.fullName}}
        </mat-option>
      </mat-autocomplete>
    </ng-container>

    <ng-container *ngIf="selectedStudent$ | async as student; else allStudentResults">
      <app-student-results-container [student]="student"></app-student-results-container>
    </ng-container>

    <ng-template #allStudentResults>


    </ng-template>

    <!--
    <ng-container *ngFor="let student of sortedStudents$ | async">
      <mat-card>
        <mat-card-title>{{student.surname}} {{student.firstName}}</mat-card-title>
        <mat-card-subtitle>
          <a [href]="student.compassLink">Compass</a>
        </mat-card-subtitle>
        <mat-card-content>
          Progress: IN DANGER
        </mat-card-content>
        <mat-card-footer>
          <button mat-button color="primary"
                  [routerLink]="['/students', student.id]">
            open
          </button>
        </mat-card-footer>
      </mat-card>
    </ng-container>
    -->
  `
})
export class StudentsOverviewPageComponent implements OnDestroy {
  private subscriptions: Subscription[] = [];

  readonly searchControl = new FormControl();

  readonly students$: Observable<{ [studentId: string]: Student }> = defer(() => this.appState.studentsForActiveSubjectClass$);
  readonly selectedStudentIdSubject = new BehaviorSubject<string | null>(null);

  readonly selectedStudent$ = this.searchControl.valueChanges.pipe(
    filter(value => value != null && typeof value !== 'string'),
    shareReplay(1)
  );

  readonly sortedStudents$ = combineLatest([
    this.students$.pipe(
      map(students => {
        const sortedStudents = [...Object.values(students)];
        sortedStudents.sort((s1, s2) => {
          const cmpSurname = s1.surname.localeCompare(s2.surname);
          const cmpFirstName = s1.firstName.localeCompare(s2.firstName);
          return cmpSurname !== 0 ? cmpSurname : cmpFirstName;
        });
        return sortedStudents;
      })
    ),
    this.searchControl.valueChanges.pipe(startWith('')),
  ]).pipe(
    map(([students, searchString]) => {
      if (typeof searchString === 'string') {
        const searchComponents = (searchString || '').split(' ');

        function isStudentIncluded(student: Student) {
          if (searchString === '') {
            return true;
          }
          return searchComponents.some(component => student.firstName.search(component) >= 0
            || student.surname.search(component) >= 0
          );
        }

        return students.filter(isStudentIncluded);
      }
      return [searchString];
    }),
    shareReplay(1)
  );

  constructor(
    readonly appState: AppStateService,
    readonly route: ActivatedRoute,
  ) {
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    this.selectedStudentIdSubject.complete();
  }

  selectStudent($event: MatAutocompleteSelectedEvent) {
    this.selectedStudentIdSubject.next($event.option.value.id);
  }

  _studentDisplay(student: Student) {
    return student && student.fullName;
  }
}
