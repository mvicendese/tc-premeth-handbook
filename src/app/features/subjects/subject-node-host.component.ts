import {Component} from '@angular/core';
import {SubjectNodeRouteContext} from './subject-node-route-context';
import {BlockState} from './blocks/block-state';
import {SubjectState} from './subject-state';
import {ActivatedRoute} from '@angular/router';


@Component({
  template: `
    <subjects-unit-page>
      <subjects-block-drawer *ngIf="routeData.block$ | async">
      </subjects-block-drawer>
    </subjects-unit-page>
  `,
  providers: [
    SubjectNodeRouteContext
  ]
})
export class SubjectNodeHostComponent {
  constructor(
    readonly routeData: SubjectNodeRouteContext
  ) {}
}
