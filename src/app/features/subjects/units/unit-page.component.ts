import {Component, OnDestroy, OnInit} from '@angular/core';
import {map, shareReplay} from 'rxjs/operators';
import {ActivatedRoute} from '@angular/router';
import {Unsubscribable} from 'rxjs';
import {SubjectNodeRouteData} from '../subject-node-route-data';

@Component({
  selector: 'subjects-unit-page',
  template: `
    <ng-container *ngIf="(unit$ | async) as unit">
      <header>
        <subjects-breadcrumb [leafNode]="unit"></subjects-breadcrumb>
      </header>
    </ng-container>

    <main>
      <ng-content></ng-content>
    </main>
  `,
  styleUrls: [
    './unit-page.component.scss'
  ],
  providers: [
    SubjectNodeRouteData,
  ]
})
export class UnitPageComponent {
  readonly unit$ = this.routeContext.unit$.pipe(
    shareReplay(1)
  );

  constructor(
    readonly routeContext: SubjectNodeRouteData
  ) {}
}
