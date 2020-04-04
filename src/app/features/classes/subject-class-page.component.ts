import {Component, OnDestroy} from '@angular/core';
import {filter, map, pluck, shareReplay, switchMap, tap} from 'rxjs/operators';
import {Observable, Subscription} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {AppStateService} from '../../app-state.service';
import {modelRefId} from '../../common/model-base/model-ref';
import {SubjectClass} from '../../common/model-types/schools';

interface UnitResultTableRow {
  unitName: string;
  markPercent: number;
}

@Component({
  selector: 'app-subject-class-page',
  template: `
  <ng-container *ngIf="(subject$ | async) as subject">
    <ng-container *ngIf="(class$ | async) as subjectClass">
      <h1>{{subjectClass.code}}</h1>

      <section>
        <h3>Students</h3>
        <div class="students-grid">
          <mat-card *ngFor="let student of subjectClass.students">
            <mat-card-title>
              <a [routerLink]="['/students', student.id]">{{student.fullName}}</a>
            </mat-card-title>
            <mat-card-subtitle>Year level: {{student.yearLevel}}</mat-card-subtitle>
          </mat-card>
        </div>
      </section>

      <section>
        <h3>Unit test results</h3>
        <mat-card *ngFor="let unit of subject.units">
          <mat-card-title>{{unit.name}}</mat-card-title>
          <mat-card-content>
            <!--
              <app-unit-results-table [unit]="unit"
                                      [students]="subjectClass.students"
                                      [studentResults]="classResults$ | async" >
              </app-unit-results-table>
              -->
          </mat-card-content>
        </mat-card>
      </section>
    </ng-container>
  </ng-container>
  `
})
export class SubjectClassPageComponent implements OnDestroy {
  private subscriptions: Subscription[] = [];

  readonly subject$ = this.appState.subject$.pipe(
    shareReplay(1)
  );

  readonly class$: Observable<SubjectClass> = this.route.data.pipe(
    pluck('subjectClass'),
    switchMap(cls => {
      return this.appState.subject$.pipe(
        filter(subject => subject != null),
        tap(subject => {
          if (subject.id !== modelRefId(cls.subject)) {
            throw new Error(`Not a class of AppState\'s subject '${subject.name}`);
          }
        }),
        map(subject => ({...cls, subject}))
      );
    }),
    shareReplay(1)
  );
  constructor(
    readonly appState: AppStateService,
    readonly route: ActivatedRoute,
  ) {}

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

}
