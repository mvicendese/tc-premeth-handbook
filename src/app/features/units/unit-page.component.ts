import {Component, OnDestroy, OnInit} from '@angular/core';
import {AppStateService} from '../../app-state.service';
import {filter, first, map, scan, shareReplay, switchMap, tap, withLatestFrom} from 'rxjs/operators';
import {ActivatedRoute} from '@angular/router';
import {combineLatest, concat, merge, Observable, race, Unsubscribable} from 'rxjs';
import {modelRefId, ModelRef} from '../../common/model-base/model-ref';
import {UnitContextService} from './unit-context.service';
import {Subject} from '../../common/model-types/subjects';
import {SubjectClass} from '../../common/model-types/schools';

@Component({
  selector: 'app-unit-page',
  template: `
    <ng-container *ngIf="(unit$ | async) as unit">
      <h1>{{unit.name}}</h1>
    </ng-container>

    <main>
      <router-outlet></router-outlet>
    </main>
  `,
  styleUrls: [
    'unit-page.component.scss'
  ],
  viewProviders: [
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


  constructor(
    readonly appState: AppStateService,
    readonly route: ActivatedRoute,
    readonly contextService: UnitContextService
  ) {}

  ngOnInit() {
    this.resources.push(this.contextService.init());
  }

  ngOnDestroy() {
    this.resources.forEach(resource => resource.unsubscribe());
  }

}
