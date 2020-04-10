import {Component, OnDestroy, OnInit} from '@angular/core';
import {map, shareReplay} from 'rxjs/operators';
import {ActivatedRoute} from '@angular/router';
import {Unsubscribable} from 'rxjs';
import {UnitPageStateService} from './unit-page-state.service';

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
    UnitPageStateService
  ]
})
export class UnitPageComponent implements OnInit, OnDestroy {
  private readonly resources: Unsubscribable[] = [];

  readonly unit$ = this.unitContext.unit$.pipe(
    shareReplay(1)
  );

  constructor(
    readonly route: ActivatedRoute,
    readonly unitContext: UnitPageStateService
  ) {}

  ngOnInit() {
    const unitId$ = this.route.paramMap.pipe(map(params => params.get('unit_id')));
    this.resources.push(this.unitContext.init(unitId$));
  }

  ngOnDestroy() {
    this.resources.forEach(resource => resource.unsubscribe());
  }

}
