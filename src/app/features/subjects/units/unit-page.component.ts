import {Component, OnDestroy, OnInit, Provider} from '@angular/core';
import {map, shareReplay} from 'rxjs/operators';
import {ActivatedRoute} from '@angular/router';
import {Observable, Unsubscribable} from 'rxjs';
import {SubjectNodeRouteData} from '../subject-node-route-data';
import {provideSubjectNodeState} from '../subject-node-state';
import {BlockState} from '../blocks/block-state';
import {UnitState} from './unit-state';
import {UnitAssessment} from '../../../common/model-types/assessments';

export function provideUnitState(): Provider[] {
  return [
    ...provideSubjectNodeState({
      assessmentType: 'unit-assessment',
      childAssessmentTypes: ['block-assessment']
    }),
    UnitState
  ];
}

@Component({
  selector: 'subjects-unit-page',
  template: `
    <ng-container *ngIf="unit$ | async as unit">
      <h1 class="unit-title">
        <span class="node-type">{{unit.type}}</span>
        <span class="unit-name">{{unit.name}}</span>
      </h1>
    </ng-container>

    <subjects-unit-results-table>
    </subjects-unit-results-table>
  `,
  styleUrls: [
    './unit-page.component.scss'
  ],
  providers: [
    provideUnitState()
  ]
})
export class UnitPageComponent implements OnInit, OnDestroy {
  private resources: Unsubscribable[] = [];

  readonly unit$ = this.routeContext.unit$.pipe(
    shareReplay(1)
  );

  readonly unitAssessments$: Observable<{[studentId: string]: UnitAssessment}> = this.unitState.unitAssessments$.pipe(
    shareReplay(1)
  );

  constructor(
    readonly unitState: UnitState,
    readonly routeContext: SubjectNodeRouteData
  ) {}

  ngOnInit() {
    this.resources.push(this.unitState.init());
  }

  ngOnDestroy(): void {
    this.resources.forEach(r => r.unsubscribe());
  }
}
