import {Component, OnDestroy, OnInit} from '@angular/core';
import {AppStateService} from '../../app-state.service';
import {filter, first, map, scan, shareReplay, switchMap, tap, withLatestFrom} from 'rxjs/operators';
import {ActivatedRoute} from '@angular/router';
import {combineLatest, concat, merge, Observable, race, Unsubscribable} from 'rxjs';
import {Subject} from '../../common/model-types/subject';
import {StudentBlockTestResult} from '../../common/model-types/student-block-test-result';
import {SubjectResult} from '../../common/model-types/subject-result';
import {getModelRefId, ModelRef} from '../../common/model-base/model-ref';
import {UnitBlock} from '../../common/model-types/unit-block';
import {StudentUnitTestResult, UnitResultParams} from '../../common/model-types/student-unit-test-result';
import {Student} from '../../common/model-types/student';
import {SubjectClass} from '../../common/model-types/subject-class';
import {Unit} from '../../common/model-types/unit';
import {UnitContextService} from './unit-context.service';
import {StudentContextService} from '../students/student-context.service';

@Component({
  selector: 'app-unit-page',
  template: `
    <ng-container *ngIf="(unit$ | async) as unit">
      <h1>{{unit.name}}</h1>
    </ng-container>

    <main>
      <!-- This form applies to all tables displayed in a subpage of this page. -->
      <form [formGroup]="paramsService.formGroup">
        <app-classes-table-filter [formControlName]="'class'">
        </app-classes-table-filter>
      </form>
      <router-outlet></router-outlet>
    </main>
  `,
  viewProviders: [
    StudentContextService,
    UnitContextService
  ]
})
export class UnitPageComponent implements OnInit, OnDestroy {
  private readonly resources: Unsubscribable[] = [];

  readonly unit$ = combineLatest([
    this.appState.subject$.pipe(
      filter((subject): subject is Subject => subject != null)
    ),
    this.route.paramMap.pipe(map(params => params.get('unit_id')))
  ]).pipe(
    map(([subject, unitId]) => subject.getUnit(unitId)),
    shareReplay(1)
  );

  readonly allClasses$: Observable<readonly SubjectClass[]> = this.appState.allClasses$.pipe(
    shareReplay(1)
  );

  readonly unitResults$: Observable<UnitResultParams>;

  constructor(
    readonly appState: AppStateService,
    readonly studentContextService: StudentContextService,
    readonly route: ActivatedRoute,
    readonly paramsService: UnitContextService
  ) {}

  ngOnInit() {
    this.resources.push(
      this.studentContextService.init()
    );
  }

  ngOnDestroy() {
    this.resources.forEach(resource => resource.unsubscribe());
  }

}
