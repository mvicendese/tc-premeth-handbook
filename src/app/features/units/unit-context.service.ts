import {Inject, Injectable} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {AppStateService} from '../../app-state.service';
import {
  distinct,
  distinctUntilChanged,
  endWith,
  filter, first,
  map,
  pluck,
  shareReplay,
  skipWhile,
  startWith,
  switchMap,
  takeUntil, tap
} from 'rxjs/operators';
import {
  BehaviorSubject,
  combineLatest,
  concat,
  defer,
  Observable,
  ObservableInput,
  of,
  Subject,
  Subscription,
  Unsubscribable,
  using
} from 'rxjs';
import {Block, LessonOutcome, LessonSchema, Subject as ModelSubject, Unit} from '../../common/model-types/subjects';
import {ModelRef, modelRefId} from '../../common/model-base/model-ref';
import {AnyReport, LessonOutcomeSelfAssessmentReport, LessonPrelearningReport, Report} from '../../common/model-types/assessment-reports';
import {LessonPrelearningAssessment} from '../../common/model-types/assessments';
import {AssessmentsService} from '../../common/model-services/assessments.service';
import {ResponsePage} from '../../common/model-base/pagination';
import {Student, SubjectClass} from '../../common/model-types/schools';

export interface UnitContextState {
  blockId: string | null;
}

@Injectable()
export class UnitContextService {
  private unitIdSubject = new Subject<string>();

  readonly unit$: Observable<Unit> = combineLatest([
      this.appState.subject$.pipe(
        filter((s): s is ModelSubject => s != null),
        distinctUntilChanged()
      ),
      this.unitIdSubject.pipe(distinctUntilChanged()),
    ]).pipe(
      map(([subject, unitId]) => {
      console.log('subject', subject, 'unitId', unitId);
      return subject.getUnit(unitId);
    }),
    shareReplay(1)
  );

  constructor(readonly appState: AppStateService) {
  }

  init(unitId: Observable<string>): Unsubscribable {
    /* keepalive unit subscription */
    this.unit$.pipe(takeUntil(this.unitIdSubject)).subscribe();
    /**
     * Keepalive unit
     */
    unitId.subscribe(this.unitIdSubject);
    return {
      unsubscribe: () => this.unitIdSubject.complete()
    };
  }
}


function lessonContextState(prelearningReport) {
  return {
    prelearningAssessments: {},
    outcomeSelfAssessmentReports: {},
  };
}

interface BlockContextState {
  readonly prelearningReports: {[lessonId: string]: LessonPrelearningReport};
}

@Injectable()
export class BlockContextService {
  private blockIdSubject = new Subject<string>();

  constructor(
    readonly assessmentsService: AssessmentsService,
    readonly appState: AppStateService,
    readonly unitContext: UnitContextService
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
      this.appState.selectedClass
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

  private blockStateSubject = new BehaviorSubject<BlockContextState>({
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

interface LessonContextState {
  readonly prelearningAssessmentsPage: number;
  readonly prelearningAssessments: {[candidateId: string]: LessonPrelearningAssessment};
  readonly outcomeSelfAssessmentReports: {[outcomeId: string]: LessonOutcomeSelfAssessmentReport};
}

@Injectable()
export class LessonContextService {
  private lessonId: string;
  private lessonStateSubject = new BehaviorSubject<LessonContextState | undefined>(undefined);
  readonly state$ = defer(() =>
    this.lessonStateSubject.pipe(filter(state => state !== undefined))
  );

  readonly lesson$ = this.blockContext.block$.pipe(
    map(block => block.getLesson(this.lessonId)),
    shareReplay(1)
  );

  constructor(
    readonly appState: AppStateService,
    readonly assessmentsService: AssessmentsService,
    readonly blockContext: BlockContextService
  ) {}

  init(lessonId: string): Unsubscribable {
    this.lessonId = lessonId;

    const loaderSubscription = combineLatest([
      this.lesson$,
      this.appState.selectedClass
    ]).subscribe(([lesson, subjectClass]) => {
      console.log('lesson', lesson.name, 'class', subjectClass && subjectClass.name);
      this.loadOutcomeReports(lesson, subjectClass);

      // TODO: More of these to load!.
      this.loadPrelearningAssessments(lesson, subjectClass);
    });
    return {
      unsubscribe: () => {
        loaderSubscription.unsubscribe();
      }
    };
  }

  /**
   * Load prelearning assessments for the given lesson, restricting the results to the given subject class.
   *
   * @param lesson: LessonSchema
   * A lesson
   *
   * @param subjectClass: SubjectClass
   * The subject class to restrict results to
   */
  protected loadPrelearningAssessments(lesson: LessonSchema, subjectClass: ModelRef<SubjectClass> | null): void {
    this.assessmentsService.queryAssessments('lesson-prelearning-assessment', {
      params: {
        node: lesson,
        class: subjectClass,
        page: this.lessonStateSubject.value ? this.lessonStateSubject.value.prelearningAssessmentsPage : 1
      }
    }).subscribe(page => {
      console.log('prelearning assessments 2');
      const prelearningAssessments = this.lessonStateSubject.value
                                  ? {...this.lessonStateSubject.value.prelearningAssessments}
                                  : {};
      page.results.forEach(result => {
        prelearningAssessments[modelRefId(result.student)] = result;
      });

      this.lessonStateSubject.next({
        ...this.lessonStateSubject.value,
        prelearningAssessments,
        prelearningAssessmentsPage: page.pageNumber + 1
      });
    });
  }

  protected loadOutcomeReports(lesson: LessonSchema, subjectClass: ModelRef<SubjectClass> | null): Subscription {
    return this.assessmentsService.queryReports('lesson-outcome-self-assessment', {
      params: {
        node: lesson,
        class: subjectClass,
      }
    }).subscribe(page => {
      // There _should_ only be one page of outcome reports per lesson.

      const reports = {};
      lesson.outcomes.forEach(outcome => {
        const outcomeReport = page.results.find(result => modelRefId(result.node) === outcome.id);
        if (outcomeReport === undefined) {
          throw new Error(`No report for lesson outcome ${outcome.id}`);
        }
        reports[outcome.id] = outcomeReport;
      });

      this.lessonStateSubject.next({
        ...this.lessonStateSubject.value,
        outcomeSelfAssessmentReports: reports
      });
    });
  }

  readonly selectedClass$ = defer(() => this.appState.selectedClass);
  readonly students$ = defer(() => this.appState.selectedClassStudents);

  readonly prelearningReport$: Observable<LessonPrelearningReport> = defer(() =>
    this.lesson$.pipe(
      switchMap(lesson => this.blockContext.getPrelearningReport(lesson))
    )
  );
  readonly prelearningAssessments$: Observable<{[candidateId: string]: LessonPrelearningAssessment}> = defer(() =>
    this.state$.pipe(
      pluck('prelearningAssessments'),
      distinctUntilChanged()
    )
  );
  readonly outcomeSelfAssessmentReports$: Observable<{[candidateId: string]: LessonOutcomeSelfAssessmentReport}> = defer(() =>
    this.state$.pipe(
      pluck('outcomeSelfAssessmentReports'),
      distinctUntilChanged()
    )
  );
}
