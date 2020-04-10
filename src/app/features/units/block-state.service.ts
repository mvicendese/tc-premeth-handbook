import {Injectable} from '@angular/core';
import {BehaviorSubject, combineLatest, Observable, Subject, Subscription, Unsubscribable} from 'rxjs';
import {AssessmentsService} from '../../common/model-services/assessments.service';
import {AppStateService} from '../../app-state.service';
import {Block, LessonSchema} from '../../common/model-types/subjects';
import {distinctUntilChanged, filter, map, pluck, shareReplay} from 'rxjs/operators';
import {ModelRef, modelRefId} from '../../common/model-base/model-ref';
import {SubjectClass} from '../../common/model-types/schools';
import {LessonPrelearningReport} from '../../common/model-types/assessment-reports';
import {UnitPageStateService} from './unit-page-state.service';

interface BlockDrawerState {
  readonly prelearningReports: {[lessonId: string]: LessonPrelearningReport};
}


@Injectable()
export class BlockStateService {

  private blockIdSubject = new Subject<string>();

  constructor(
    readonly assessmentsService: AssessmentsService,
    readonly appState: AppStateService,
    readonly unitContext: UnitPageStateService
  ) {}

  readonly block$: Observable<Block> =
    combineLatest([
      this.unitContext.unit$,
      this.blockIdSubject.pipe(distinctUntilChanged())
    ]).pipe(
      map(([unit, blockId]) => unit.getBlock(blockId)),
      distinctUntilChanged(),
      shareReplay(1)
    );

  init(blockId$: Observable<string>): Unsubscribable {
    const reportLoaderSubscription = combineLatest([
      this.block$,
      this.appState.activeSubjectClass$
    ]).subscribe(([block, subjectClass]) => {
      this.loadPrelearningReports(block, subjectClass);
    });

    blockId$.subscribe(this.blockIdSubject);
    return {
      unsubscribe: () => {
        reportLoaderSubscription.unsubscribe();
        this.blockIdSubject.complete();
        this.blockStateSubject.complete();
      }
    };
  }

  private blockStateSubject = new BehaviorSubject<BlockDrawerState>({
    prelearningReports: {}
  });

  protected loadPrelearningReports(block: Block, subjectClass: ModelRef<SubjectClass> | null): Subscription {
    return this.assessmentsService.queryReports('lesson-prelearning-assessment', {
      params: {
        node: block,
        class: subjectClass
      }
    }).subscribe(page => {
      console.log('got page');
      // Should only be one page.
      page.results.forEach(report => {
        const prelearningReports = {
          ...this.blockStateSubject.value.prelearningReports,
          [modelRefId(report.node)]: report
        };
        this.blockStateSubject.next({...this.blockStateSubject.value, prelearningReports});
      });
    });
  }

  getPrelearningReport(lesson: ModelRef<LessonSchema>): Observable<LessonPrelearningReport> {
    return this.blockStateSubject.pipe(
      pluck('prelearningReports'),
      pluck(modelRefId(lesson)),
      filter(report => report !== undefined)
    );
  }
}
