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


@Component({
  selector: 'subjects-lesson-page',
  template: `
    <ng-container *ngIf="lesson$ | async as lesson">
      <div class="title">
        <h2><span>{{lesson.context.unit.name}}</span></h2>
        <h2><mat-icon inline>chevron_right</mat-icon><span>{{lesson.context.block.name}}</span></h2>
        <h2><mat-icon inline>chevron_right</mat-icon><span>{{lesson.name}}</span></h2>
      </div>
    </ng-container>

    <mat-tab-group>
      <mat-tab label="Prelearning">
        <ng-template matTabContent>
          <subjects-lesson-prelearning-tab></subjects-lesson-prelearning-tab>
        </ng-template>
      </mat-tab>
      <mat-tab label="Student outcomes" class="d-flex">
       <ng-template matTabContent>
         <subjects-lesson-outcomes-tab></subjects-lesson-outcomes-tab>
       </ng-template>
      </mat-tab>
    </mat-tab-group>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      width: 100%;
      padding-top: 2rem;
    }
    :host .title {
      display: flex;
    }
    :host .title h2 {
      display: flex;
      align-items: center;
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

  readonly prelearningAssessments$: Observable<{[candidateId: string]: Resolve<LessonPrelearningAssessment, 'student'>}>;

  constructor(
    readonly lessonState: LessonState
  ) {}

  ngOnInit() {
    this.resources.push(this.lessonState.init());
  }
  ngOnDestroy(): void {
    this.resources.forEach(r => r.unsubscribe());
  }
}
