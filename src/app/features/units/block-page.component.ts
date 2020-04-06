import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {filter, map, shareReplay} from 'rxjs/operators';
import {combineLatest, Unsubscribable} from 'rxjs';
import {BlockContextService, UnitContextService} from './unit-context.service';
import {AppStateService} from '../../app-state.service';


@Component({
  selector: 'app-unit-block-page',
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
  providers: [
    BlockContextService
  ]
})
export class BlockPageComponent implements OnInit, OnDestroy {
  private resources: Unsubscribable[] = [];

  readonly block$ = this.blockContext.block$.pipe(
    shareReplay(1)
  );

  constructor(
    readonly appState: AppStateService,
    readonly route: ActivatedRoute,
    readonly blockContext: BlockContextService
  ) {}

  ngOnInit() {
    const blockId$ = this.route.paramMap.pipe(map(paramMap => paramMap.get('block_id')));
    this.resources.push(this.blockContext.init(blockId$));
  }

  ngOnDestroy(): void {
   this.resources.forEach(r => r.unsubscribe());
  }
}
