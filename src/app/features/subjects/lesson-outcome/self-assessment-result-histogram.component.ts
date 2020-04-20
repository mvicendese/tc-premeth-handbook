import {AfterViewInit, Component, ElementRef, Host, Input, OnDestroy, Renderer2, ViewChild, ViewEncapsulation} from '@angular/core';
import {modelRefId} from '../../../common/model-base/model-ref';
import * as d3 from 'd3';
import {Set} from 'immutable';
import {asyncScheduler, AsyncSubject, BehaviorSubject, combineLatest, defer, Observable, of, timer, Unsubscribable,} from 'rxjs';
import {LessonOutcomeSelfAssessmentReport} from '../../../common/model-types/assessment-reports';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  first,
  map,
  observeOn,
  pluck,
  scan,
  shareReplay,
  switchMap,
  withLatestFrom
} from 'rxjs/operators';
import {Student} from '../../../common/model-types/schools';
import {LessonOutcomeSelfAssessment} from '../../../common/model-types/assessments';

interface Cell {
  readonly candidateId: string;
  readonly rating: number | null;
}

type Bin = {
  readonly rating: number | null;
  readonly cells: Cell[];
};

function histogramBinData(report: LessonOutcomeSelfAssessmentReport): Bin[] {
  const bins = Array.from(
    new Array(6)).map((_, i) => ({
      rating: i,
      cells: []
    }));
  const candidateScores = report.candidateRatings;

  report.candidates.forEach(candidateId => {
    if (report.attemptedCandidates.includes(candidateId)) {
      const rating = candidateScores[modelRefId(candidateId)];
      if (rating === undefined) {
        throw new Error(`No score for attempted candidate`);
      }
      bins[rating].cells.push({candidateId, rating});
    } else {
      bins[0].cells.push({candidateId, rating: null});
    }
  });
  return bins;
}

interface BinState {
  hoverCandidate: string | null;
  hoverRating: {value: number | null} | null;

  activeCandidate: string | null;
  activeRating: {value: number | null} | null;
}

function isCellInHoverState({hoverRating, hoverCandidate}: BinState, cell: Cell) {
  return hoverRating && hoverRating.value === cell.rating
      || hoverCandidate === cell.candidateId;
}

function isCellInActiveState({activeRating, activeCandidate}: BinState, cell: Cell) {
  return activeRating && activeRating.value === cell.rating
      || activeCandidate === cell.candidateId;
}

function isBinLabelInHoverState({hoverRating}: BinState, bin: Bin) {
  return hoverRating && hoverRating.value === bin.rating;
}

function isBinLabelInActiveState({activeRating}: BinState, bin: Bin) {
  return activeRating && activeRating.value === bin.rating;
}

// browser-only
@Component({
  selector: 'app-lesson-outcome-histogram',
  template: `
    <div #container class="container"></div>

    <mat-list class="student-card-container">
      <mat-list-item *ngFor="let candidate of (displayCandidates$ | async)">
        <schools-student-item [student]="candidate.candidateId"
                              [class.active]="candidate.isActive"
                              [class.hover]="candidate.isHover">
        </schools-student-item>
      </mat-list-item>
    </mat-list>
  `,
  styleUrls: ['./self-assessment-result-histogram.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom
})
export class SelfAssessmentResultHistogramComponent implements AfterViewInit, OnDestroy {
  static readonly DOMAIN_LABELS = [
    'N/A', '★', '★★', '★★★', '★★★★', '★★★★★'
  ];

  private resources: Unsubscribable[] = [];

  private readonly reportSubject = new BehaviorSubject<LessonOutcomeSelfAssessmentReport | undefined>(undefined);
  private readonly stateSubject = new BehaviorSubject<BinState>({
    hoverCandidate: null,
    hoverRating: null,
    activeCandidate: null,
    activeRating: null
  });

  private binData$ = defer(() => this.reportSubject.pipe(map(report => histogramBinData(report))));

  readonly displayCandidates$: Observable<{candidateId: string, isHover: boolean, isActive: boolean}[]> = combineLatest([
      this.binData$,
      this.stateSubject
  ]).pipe(
    map(([bins, state]) =>
      bins.flatMap(
        bin => bin.cells.flatMap(cell => {
          const isActive = isCellInActiveState(state, cell);
          const isHover = isCellInHoverState(state, cell);

          if (isActive || isHover) {
            return [{ candidateId: cell.candidateId, isActive, isHover }];
          } else {
            return [];
          }
        })
      )
    ),
    shareReplay(1)
  );

  @ViewChild('container', {static: true})
  readonly container: ElementRef<HTMLDivElement>;

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

  ngAfterViewInit() {
    const initBins = this.binData$.subscribe(binData => {
      const node = this.drawHistogram(binData);
      if (this.container.nativeElement.firstChild) {
        this.renderer.removeChild(this.container.nativeElement, this.container.nativeElement.firstChild);
      }
      this.renderer.appendChild(this.container.nativeElement, node.node());
    });
    this.resources.push(initBins);

    const redrawBins = combineLatest([this.binData$, this.stateSubject]).pipe(
      observeOn(asyncScheduler)
    ).subscribe(([binData, state]) => {
      this.redrawHistogram(binData, state);
    });
    this.resources.push(redrawBins);
  }

  ngOnDestroy(): void {
    this.reportSubject.complete();
    this.stateSubject.complete();

    this.resources.forEach(resource => resource.unsubscribe());
  }

  protected selectContainerElement() {
    return d3.select(this.container.nativeElement);
  }

  protected drawHistogram(binDatas: Bin[]) {
    const content = this.selectContainerElement()
      .append('div')
      .attr('class', 'content');

    const bins = content
      .selectAll('div')
      .data(() => binDatas)
      .join('div')
      .attr('class', 'bin');

    const cells = bins
      .selectAll('div')
      .data((column) => [...column.cells])
      .join('div')
      .attr('class', 'cell');

    cells
      .on('click', (cell) => {
        console.log('click');
        this.selectCandidate(cell.candidateId);
      })
      .on('mouseenter', (cell) => this.hoverCandidate(cell.candidateId))
      .on('mouseleave', () => this.hoverCandidate(null));

    const labels = bins
      .append('div')
      .attr('class', 'bin-label')
      .text((bin, index) => SelfAssessmentResultHistogramComponent.DOMAIN_LABELS[index])
      .on('click', (bin) => this.selectRating({value: bin.rating}))
      .on('mouseenter', (bin) => this.hoverRating({value: bin.rating}))
      .on('mouseleave', (bin) => this.hoverRating(null));

    return content;
  }

  protected redrawHistogram(binDatas: Bin[], state: BinState) {
    const container = this.selectContainerElement();
    const content = container.selectAll('div.content');

    const bins = content.selectAll('div.bin').data<Bin>(binDatas);

    const cells = bins
      .selectAll('div.cell')
      .data((bin) => bin.cells)
      .attr('class', function (cell) {
        const classes = ['cell'];
        if (isCellInActiveState(state, cell)) {
          classes.push('active');
        }

        if (isCellInHoverState(state, cell)) {
          classes.push('hover');
        }
        return classes.join(' ');
      });

    const labels = content
      .selectAll('div.bin-label')
      .attr('class', (bin: Bin) => {
        const classes = ['bin-label'];
        if (isBinLabelInActiveState(state, bin)) {
          classes.push('hover');
        }
        if (isBinLabelInHoverState(state, bin)) {
          classes.push('active');
        }
        return classes.join(' ');
      });
  }

  protected selectRating(rating: {value: number | null}) {
    console.log('select rating', rating);
    this.stateSubject.next({ ...this.stateSubject.value, activeCandidate: null, activeRating: rating });
  }

  protected selectCandidate(candidateId: string) {
    this.stateSubject.next({...this.stateSubject.value, activeRating: null, activeCandidate: candidateId });
  }

  protected clearActive() {
    this.stateSubject.next({...this.stateSubject.value, activeRating: null, activeCandidate: null});
  }

  hoverRating(rating: {value: number | null}) {
    this.stateSubject.next({...this.stateSubject.value, hoverRating: rating, hoverCandidate: null});
  }

  protected hoverCandidate(candidateId: string | null) {
    this.stateSubject.next({...this.stateSubject.value, hoverCandidate: candidateId, hoverRating: null});
  }

  protected clearHover() {
    this.stateSubject.next({...this.stateSubject.value, hoverCandidate: null, hoverRating: null});
  }
}
