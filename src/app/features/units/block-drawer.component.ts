import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';

import {map, shareReplay} from 'rxjs/operators';
import {Unsubscribable} from 'rxjs';

import {BlockStateService} from './block-state.service';


@Component({
  selector: 'app-unit-block-drawer',
  template: `
    <ng-container *ngIf="(block$ | async) as block">
      <h2>{{block.name}}</h2>

      <mat-accordion>
        <mat-expansion-panel *ngFor="let lesson of block.lessons">
          <mat-expansion-panel-header>
            <mat-panel-title>
              <span class="lesson-code">{{lesson.code}}</span> {{lesson.name}}
            </mat-panel-title>
          </mat-expansion-panel-header>

          <app-units-lesson-expansion [lesson]="lesson">
          </app-units-lesson-expansion>
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
  viewProviders: [
    BlockStateService
  ]
})
export class BlockDrawerComponent implements OnInit, OnDestroy {
  private resources: Unsubscribable[] = [];

  readonly block$ = this.blockContext.block$.pipe(
    shareReplay(1)
  );

  constructor(
    readonly route: ActivatedRoute,
    readonly blockContext: BlockStateService
  ) {}

  ngOnInit() {
    const blockId$ = this.route.paramMap.pipe(map(paramMap => paramMap.get('block_id')));
    this.resources.push(this.blockContext.init(blockId$));
  }

  ngOnDestroy(): void {
   this.resources.forEach(r => r.unsubscribe());
  }
}
