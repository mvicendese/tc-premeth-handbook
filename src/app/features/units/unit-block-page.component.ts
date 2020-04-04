import {Component, OnDestroy, OnInit} from '@angular/core';
import {UnitPageComponent} from './unit-page.component';
import {ActivatedRoute} from '@angular/router';
import {filter, map, shareReplay} from 'rxjs/operators';
import {combineLatest, Unsubscribable} from 'rxjs';
import {UnitContextService} from './unit-context.service';
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
  `]
})
export class UnitBlockPageComponent implements OnInit, OnDestroy {
  private resources: Unsubscribable[] = [];

  readonly block$ = this.unitContext.block$.pipe(
    filter(block => block != null),
    shareReplay(1)
  );

 constructor(
    readonly unitContext: UnitContextService,
    readonly appState: AppStateService,
    readonly route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.resources.push(this.unitContext.useBlockRoute(this.route));
  }

  ngOnDestroy(): void {
   this.resources.forEach(r => r.unsubscribe());
  }
}
