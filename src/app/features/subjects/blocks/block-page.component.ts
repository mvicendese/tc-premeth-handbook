import {Component, OnDestroy, OnInit} from '@angular/core';

import {shareReplay} from 'rxjs/operators';
import {Unsubscribable} from 'rxjs';

import {BlockState, provideBlockState} from './block-state';
import {Router} from '@angular/router';
import {LessonSchema} from '../../../common/model-types/subjects';
import {modelRefId} from '../../../common/model-base/model-ref';
import {SubjectNodeRouteData} from '../subject-node-route-data';


@Component({
  selector: 'subjects-block-page',
  template: `
    <ng-container *ngIf="(block$ | async) as block">
      <div class="title-container">
        <h1>{{block.context.unit.name}}</h1>
        <h1><mat-icon>chevron_right</mat-icon>{{block.name}}</h1>
      </div>
      <subjects-tree-nav [root]="block"></subjects-tree-nav>
      <!--
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
      -->
      
      
    </ng-container>
  `,
  styles: [`
    .title-container {
      display: flex;
    } 
    
    .title-container h1 {
      display: flex;
      align-items: center;
    }
    
    span.lesson-code {
      width: 2rem;
      font-weight: 700;
    }
  `],
  providers: [
    ...provideBlockState()
  ]
})
export class BlockPageComponent implements OnInit, OnDestroy {
  private resources: Unsubscribable[] = [];

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
