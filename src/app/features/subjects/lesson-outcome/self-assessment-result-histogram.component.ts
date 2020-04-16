import {AfterViewInit, Component, ElementRef, Host, Input, OnDestroy, Renderer2, ViewChild, ViewEncapsulation} from '@angular/core';
import {modelRefId} from '../../../common/model-base/model-ref';
import * as d3 from 'd3';
import {Set} from 'immutable';
import {AsyncSubject, BehaviorSubject, combineLatest, defer, Observable, timer,} from 'rxjs';
import {LessonOutcomeSelfAssessmentReport} from '../../../common/model-types/assessment-reports';
import {debounceTime, distinctUntilChanged, filter, map, pluck, shareReplay, withLatestFrom} from 'rxjs/operators';

interface Cell {
  readonly candidateId: string;
}

type Bin = { readonly cells: ReadonlyArray<Cell> };

function histogramBinData(report: LessonOutcomeSelfAssessmentReport): Bin[] {
  const bins = Array.from(new Array(6)).map(() => ({cells: []}));
  const candidateScores = report.candidateScores;

  report.candidateIds.forEach(candidateId => {
    if (report.attemptedCandidateIds.includes(candidateId)) {
      const score = candidateScores[modelRefId(candidateId)];
      if (score === undefined) {
        throw new Error(`No score for attempted candidate`);
      }
      bins[score].cells.push({candidateId});
    } else {
      bins[0].cells.push({candidateId});
    }
  });
  return bins;
}


// browser-only
@Component({
  selector: 'app-lesson-outcome-histogram',
  template: `
    <div #container class="container"></div>

    <ng-container *ngIf="(selectedCandidateIds$ | async) as selectedIds">
      <mat-list class="student-card-container">

        <ng-container *ngIf="!selectedIds.isEmpty()">
          <mat-list-item *ngFor="let candidateId of (highlightCandidateIds$ | async)">
            <app-student-card [student]="candidateId"></app-student-card>
          </mat-list-item>
        </ng-container>

      </mat-list>
    </ng-container>
  `,
  styles: [`
    :host {
      height: 100%;
      display: flex;
      flex-direction: row;
    }

    mat-list {
      height: 20rem;
      flex-grow: 1;
      overflow-y: auto;
    }

    .content {
      width: 25rem;
      height: 20rem;
      font-size: 10px;
      color: white;
    }

    .content {
      display: flex;
      flex-direction: row;
    }

    .bin {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;

      flex-grow: 1;
      flex-shrink: 0;

      margin: 0 3px;
    }

    .bin-label {
      color: black;
      font-weight: bold;
      margin-top: 0.5rem;
    }

    .cell {
      box-sizing: border-box;
      font-size: inherit;
      flex-shrink: 0;

      height: 2em;
      width: 2em;
      border-radius: 2em;

      margin: 0.5em 0;

      background-color: steelblue;
    }

    .cell.hover, .cell:hover {
      border: 0.2em solid orange;
    }

    .cell.active {
      background-color: blue;
    }
  `],
  encapsulation: ViewEncapsulation.ShadowDom
})
export class SelfAssessmentResultHistogramComponent implements AfterViewInit, OnDestroy {

  private readonly reportSubject = new BehaviorSubject<LessonOutcomeSelfAssessmentReport | undefined>(undefined);
  private readonly mouseoverLabelSubject = new BehaviorSubject<number | null>(null);
  private readonly mouseOverCandidateIdsSubject = new BehaviorSubject<Set<string>>(Set());
  private readonly selectedCandidateIdsSubject = new BehaviorSubject<Set<string>>(Set());

  readonly selectedIds$ = defer(() => this.selectedCandidateIdsSubject.asObservable());

  readonly highlightCandidateIds$ = combineLatest([
    this.selectedIds$,
    this.mouseOverCandidateIdsSubject,
  ]).pipe(
    map(([selectedIds, mouseOverIds]) => selectedIds.isEmpty() ? Set() : mouseOverIds),
    distinctUntilChanged()
  );

  readonly selectedCandidateIds$ = defer(
    () => this.selectedCandidateIdsSubject.asObservable()
  );

  @ViewChild('container', {static: true})
  readonly container: ElementRef<HTMLDivElement>;

  private bins$: Observable<Bin[]> = this.reportSubject.pipe(
    filter(report => report !== undefined),
    distinctUntilChanged(),
    map(report => histogramBinData(report)),
    shareReplay(1)
  );
  candidateId: string;

  @Input()
  get report() {
    return this.reportSubject.value;
  }

  set report(report: LessonOutcomeSelfAssessmentReport) {
    this.reportSubject.next(report);
  }

  constructor(
    readonly renderer: Renderer2,
    @Host() readonly element: ElementRef<Element>
  ) {
  }

  async ngAfterViewInit() {
    combineLatest([this.bins$, this.selectedCandidateIdsSubject, this.mouseOverCandidateIdsSubject]).pipe(
      pluck(0),
      debounceTime(100)
    ).subscribe(bins => {
      const node = this.drawHistogram(bins);

      if (this.container.nativeElement.firstChild != null) {
        this.renderer.removeChild(this.container.nativeElement, this.container.nativeElement.firstChild);
      }
      this.renderer.appendChild(this.container.nativeElement, node.node());
    });
  }

  ngOnDestroy(): void {
    this.reportSubject.complete();
    this.mouseOverCandidateIdsSubject.complete();
    this.selectedCandidateIdsSubject.complete();
  }

  protected drawHistogram(
    binDatas: Bin[]
  ) {
    const content = d3.create('div').attr('class', 'content');

    const bins = content
      .selectAll('div')
      .data(() => binDatas)
      .join('div')
      .attr('class', 'bin');


    const cells = bins
      .selectAll('div')
      .data((column) => [...column.cells])
      .join('div');

    cells
      .on('click',      (cell) => this.selectCandidate(cell.candidateId))
      .on('mouseover',  (cell) => this.mouseoverCandidate(cell.candidateId))
      .on('mouseleave', (cell) => this.mouseleaveCandidate(cell.candidateId))
      .attr('class', (cell) => {
        const classes = ['cell'];
        if (this.isSelectedCandidate(cell.candidateId)) {
          classes.push('active');
        }
        if (this.isMouseoverCandidate(cell.candidateId)) {
          classes.push('hover');
        }
        return classes.join(' ');
      });

    const xLabels = ['N/A', '1 star', '2 stars', '3 stars', '4 stars', '5 stars'];
    const scale = d3.scaleOrdinal(xLabels);

    const labels = bins
      .append('button')
      .text((bin, index) => xLabels[index])
      .on('click',      (bin) => this.selectCandidates(bin.cells.map(cell => cell.candidateId)))
      .on('mouseover', (bin) => this.mouseoverCandidates(bin.cells.map(cell => cell.candidateId)))
      .on('mouseleave', (bin) => this.mouseleaveCandidates(bin.cells.map(cell => cell.candidateId)))
      .attr('class', (bin: Bin) => {
        const classes: string[] = ['bin-label', 'mat-focus-indicator', 'mat-button', 'mat-button-base'];
        if (bin.cells.every(cell => this.isSelectedCandidate(cell.candidateId))) {
          classes.push('active');
        }
        if (bin.cells.every(cell => this.isMouseoverCandidate(cell.candidateId))) {
          classes.push('hover');
        }
        return classes.join(' ');
      });

    labels.append('div').attr('class', (bin) => {
      if (bin.cells.every(cell => this.isMouseoverCandidate(cell.candidateId))) {
        return 'mat-button-focus-overlay';
      }
    });

    return content;
  }

  isSelectedCandidate(candidateId: string) {
    return this.selectedCandidateIdsSubject.value.has(candidateId);
  }

  selectCandidates(candidateIds: string[]) {
    this.selectedCandidateIdsSubject.next(Set(candidateIds));
  }
  deselectCandidates(candidateIds: string[]) {
    timer(300).subscribe(() => {
      this.selectedCandidateIdsSubject.next(this.selectedCandidateIdsSubject.value.subtract(candidateIds));
    });
  }
  selectCandidate(candidateId: string) {
    this.selectedCandidateIdsSubject.next(Set.of(candidateId));
  }

  isMouseoverCandidate(candidateId: string) {
    return this.mouseOverCandidateIdsSubject.value.has(candidateId);
  }

  mouseoverCandidates(candidateIds: string[]) {
    this.mouseOverCandidateIdsSubject.next(Set(candidateIds));
  }
  mouseleaveCandidates(candidateIds: string[]) {
    timer(300).subscribe(() => {
      const mouseOverIds = this.mouseOverCandidateIdsSubject.value;
      this.mouseOverCandidateIdsSubject.next(mouseOverIds.subtract(candidateIds));
    });
  }
  mouseoverCandidate(candidateId: string | null) {
    this.mouseOverCandidateIdsSubject.next(Set.of(candidateId));
  }
  mouseleaveCandidate(candidateId: string | null) {
    timer(300).subscribe(() => {
      const mouseoverIds = this.mouseOverCandidateIdsSubject.value;
      this.mouseOverCandidateIdsSubject.next(mouseoverIds.remove(candidateId));
    })
  }

  mouseoverLabel(labelIndex: number | null) {
    this.mouseoverLabelSubject.next(labelIndex);
  }
}
