import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {pluck, shareReplay} from 'rxjs/operators';
import {Observable, Subscription} from 'rxjs';
import {Student} from '../../common/model-types/student';
import {AppStateService} from '../../app-state.service';


@Component({
  selector: 'app-student-view-host',
  template: `
    <ng-container *ngIf="(student$ | async) as student">
      <h1>{{student.fullName}}</h1>
    </ng-container>
    <hr/>
    <router-outlet></router-outlet>
  `
})
export class StudentViewHostComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];

  readonly student$: Observable<Student> = this.route.data.pipe(
    pluck('student'),
    shareReplay(1)
  ) ;

  constructor(
    readonly appState: AppStateService,
    readonly route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.student$.subscribe(student => {
        this.appState.setState('student', student);
      })
    );

  }

  ngOnDestroy() {
    this.subscriptions
      .filter(subscription => !subscription.closed)
      .forEach(subscription => subscription.unsubscribe());
  }

}
