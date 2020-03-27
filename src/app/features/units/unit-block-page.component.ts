import {Component} from '@angular/core';
import {UnitPageComponent} from './unit-page.component';
import {ActivatedRoute} from '@angular/router';
import {map, shareReplay} from 'rxjs/operators';
import {combineLatest} from 'rxjs';
import {UnitContextService} from './unit-context.service';


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
export class UnitBlockPageComponent {
  readonly block$ = combineLatest([
    this.unitPage.unit$,
    this.route.paramMap.pipe(map(params => params.get('block_id')))
  ]).pipe(
    map(([unit, blockId]) => {
      const block = unit.blocks.find(item => item.id === blockId);
      if (block == null) {
        throw new Error(`No block with id '${blockId}'`);
      }
      return block;
    }),
    shareReplay(1)
  );

  readonly allStudents$ = this.tableParams.students$.pipe(
    shareReplay(1)
  );


 constructor(
    readonly unitPage: UnitPageComponent,
    readonly tableParams: UnitContextService,
    readonly route: ActivatedRoute
  ) {}

}
