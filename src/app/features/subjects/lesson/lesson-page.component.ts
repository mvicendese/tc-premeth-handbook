import {Component, OnDestroy, OnInit} from '@angular/core';
import {LessonState, provideLessonState} from './lesson-state';
import {shareReplay} from 'rxjs/operators';
import {LessonPrelearningAssessment} from '../../../common/model-types/assessments';
import {Observable, Unsubscribable} from 'rxjs';
import {Resolve} from '../../../common/model-base/model-ref';
import {ChangeCompletionStateEvent} from './prelearning-result-item.component';
import {LessonSchema} from '../../../common/model-types/subjects';
import {SubjectNodeRouteData} from '../subject-node-route-data';
import {BlockState} from '../blocks/block-state';
import {AppStateService} from '../../../app-state.service';


@Component({
  selector: 'subjects-lesson-page',
  template: `
    <header *ngIf="lesson$ | async as lesson">

      <subjects-breadcrumb [leafNode]="lesson"></subjects-breadcrumb>
      <div class="class-info">
        <ng-container *ngIf="activeSubjectClass$ | async as subjectClass; else allStudents">
          {{subjectClass.classCode.toLocaleUpperCase()}}
        </ng-container>

        <ng-template #allStudents>
          ALL STUDENTS
        </ng-template>
      </div>
    </header>

    <main>
      <mat-tab-group>
        <mat-tab label="Prelearning">
          <ng-template matTabContent>
            <subjects-lesson-prelearning-tab class="tab-content"></subjects-lesson-prelearning-tab>
          </ng-template>
        </mat-tab>
        <mat-tab label="Student outcomes" class="d-flex">
          <ng-template matTabContent>
            <subjects-lesson-outcomes-tab class="tab-content"></subjects-lesson-outcomes-tab>
          </ng-template>
        </mat-tab>
      </mat-tab-group>
    </main>
  `,
  styleUrls: [
    './lesson-page.component.scss'
  ],
  styles: [`
    :host {
      display: block;
      height: 100%;
      width: 100%;
      padding-top: 2rem;
    }
    
    .class-info {
      padding-left: 2em;
    }

    :host .title {
      display: flex;
    }

    :host .title h2 {
      display: flex;
      align-items: center;
    }

    .tab-content {
      display: flex;
      padding-top: 1rem;
    }
  `],
  providers: [
    ...provideLessonState()
  ]
})
export class LessonPageComponent implements OnInit, OnDestroy {
  protected readonly resources: Unsubscribable[] = [];

  readonly lesson$: Observable<LessonSchema> = this.lessonState.lesson$.pipe(
    shareReplay(1)
  );

  readonly prelearningReport$ = this.lessonState.lessonPrelearningReport$.pipe(
    shareReplay(1)
  );

  readonly activeSubjectClass$ = this.appState.activeSubjectClass$;

  readonly prelearningAssessments$: Observable<{ [candidateId: string]: Resolve<LessonPrelearningAssessment, 'student'> }>;

  constructor(
    readonly appState: AppStateService,
    readonly lessonState: LessonState
  ) {
  }

  ngOnInit() {
    this.resources.push(this.lessonState.init());
  }

  ngOnDestroy(): void {
    this.resources.forEach(r => r.unsubscribe());
  }
}
