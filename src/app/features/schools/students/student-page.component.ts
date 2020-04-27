import {Component, OnDestroy, OnInit} from '@angular/core';
import {Observable, Subscription, Unsubscribable} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {map, pluck} from 'rxjs/operators';
import {Student} from '../../../common/model-types/schools';
import {StudentState} from './student-state';

interface Tab {
  readonly path: string;
  readonly label: string;
}

@Component({
  selector: 'app-student-page',
  template: `
    <ng-container *ngIf="student$ | async as student">

      <header>
        <schools-student-info [student]="student"></schools-student-info>
      </header>

      <main>
        <nav mat-tab-nav-bar>
          <a mat-tab-link *ngFor="let tab of tabs"
             [active]="tab.path === (activeTabPath$ | async)"
             (click)="openTab(tab)">
          </a>
        </nav>

        <mat-tab-group>
          <mat-tab label="Overview">
            <ng-template matTabContent>
              <schools-student-progress-overview-tab>
              </schools-student-progress-overview-tab>
            </ng-template>
          </mat-tab>
          <mat-tab label="Prelearning">
            <ng-template matTabContent>
              <schools-student-progress-prelearning-assessment-tab
                  [progress]="state.lessonPrelearningAssessmentProgress$ | async">
              </schools-student-progress-prelearning-assessment-tab>
            </ng-template>
          </mat-tab>
          <mat-tab label="Lesson outcomes">
            <ng-template matTabContent>
              <schools-student-progress-lesson-outcome-self-assessment-tab
                  [progress]="state.lessonOutcomeSelfAssessmentProgress$ | async">
              </schools-student-progress-lesson-outcome-self-assessment-tab>
            </ng-template>
          </mat-tab>
        </mat-tab-group>
      </main>
    </ng-container>

  `,
  providers: [
    StudentState
  ],
  styleUrls: [
    './student-page.component.scss'
  ]
})
export class StudentPageComponent implements OnInit, OnDestroy {
  private resources: Unsubscribable[] = [];

  readonly tabs: Tab[] = [];

  constructor(
    readonly router: Router,
    readonly route: ActivatedRoute,
    readonly state: StudentState,
  ) {
  }

  readonly student$: Observable<Student> = this.route.data.pipe(
    pluck('student')
  );

  readonly activeTabPath$ = this.route.url.pipe(
    map(url => url[0] && url[0].path)
  );


  ngOnInit() {
    this.resources.push(this.state.init());
  }

  ngOnDestroy() {
    this.resources
      .forEach(r => r.unsubscribe());
  }

  openTab(tab: Tab) {
    return this.router.navigate(['./', tab.path]);
  }

}
