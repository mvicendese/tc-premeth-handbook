import {Component, OnDestroy, OnInit} from '@angular/core';

import {shareReplay} from 'rxjs/operators';
import {Unsubscribable} from 'rxjs';

import {BlockState} from './block-state';
import {Router} from '@angular/router';
import {LessonSchema} from '../../../common/model-types/subjects';
import {modelRefId} from '../../../common/model-base/model-ref';


@Component({
  selector: 'subjects-block-drawer',
  template: `
    <ng-container *ngIf="(block$ | async) as block">
      <h2>{{block.name}}</h2>
      <mat-accordion>
        <mat-expansion-panel *ngFor="let lesson of block.lessons"
                             [expanded]="lesson.id === (activeLessonId$ | async)"
                             (opened)="lessonPanelOpened(lesson)">
          <mat-expansion-panel-header>
            <mat-panel-title>
              <span class="lesson-code">{{lesson.code}}</span> {{lesson.name}}
            </mat-panel-title>
          </mat-expansion-panel-header>

          <ng-template matExpansionPanelContent>
            <subjects-lesson-expansion></subjects-lesson-expansion>
          </ng-template>
        </mat-expansion-panel>
      </mat-accordion>
    </ng-container>
  `,
  styles: [`
    span.lesson-code {
      width: 2rem;
      font-weight: 700;
    }
  `],
  providers: [
    BlockState
  ]
})
export class BlockDrawerComponent implements OnInit, OnDestroy {
  private resources: Unsubscribable[] = [];

  readonly activeLessonId$ = this.blockState.activeLessonId$.pipe(
    shareReplay(1)
  );

  readonly block$ = this.blockState.block$.pipe(
    shareReplay(1)
  );

  constructor(
    readonly router: Router,
    readonly blockState: BlockState
  ) {
  }

  ngOnInit() {
    this.resources.push(this.blockState.init());
  }

  ngOnDestroy(): void {
    this.resources.forEach(r => r.unsubscribe());
  }

  lessonPanelOpened(lesson: LessonSchema): Promise<boolean> {
    return this.router.navigate(['/subjects', 'lesson', modelRefId(lesson)]);

  }
}
