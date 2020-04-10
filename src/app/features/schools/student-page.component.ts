import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {StudentViewHostComponent} from './student-view-host.component';


@Component({
  selector: 'app-student-page',
  template: `
    <ng-container *ngIf="student$ | async">

    </ng-container>
  `
})
export class StudentPageComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];

  constructor(
    readonly viewHost: StudentViewHostComponent,
    readonly route: ActivatedRoute
  ) {}

  get student$() {
    return this.viewHost.student$;
  }

  ngOnInit() {

  }

  ngOnDestroy() {
    this.subscriptions
      .filter(subscription => !subscription.closed)
      .forEach(subscription => subscription.unsubscribe());
  }

}
