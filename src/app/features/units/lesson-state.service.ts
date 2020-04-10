import {CompletionState, createPrelearningAssessment, LessonPrelearningAssessment} from '../../common/model-types/assessments';
import {LessonOutcomeSelfAssessmentReport, LessonPrelearningReport} from '../../common/model-types/assessment-reports';
import {Injectable} from '@angular/core';
import {BehaviorSubject, combineLatest, defer, Observable, of, OperatorFunction, pipe, Subscription, Unsubscribable} from 'rxjs';
import {distinctUntilChanged, first, map, pluck, share, skipWhile, switchMap, tap, withLatestFrom} from 'rxjs/operators';
import {AppStateService} from '../../app-state.service';
import {AssessmentsService} from '../../common/model-services/assessments.service';
import {ModelRef, modelRefId, Resolve} from '../../common/model-base/model-ref';
import {BlockStateService} from './block-state.service';
import {ModelResolveQueue} from '../../common/model-base/resolve-queue';
import {Student} from '../../common/model-types/schools';
import {LessonSchema} from '../../common/model-types/subjects';


interface LessonState {
  readonly lessonId: string;
  readonly lesson: LessonSchema;

  readonly prelearningReport: LessonPrelearningReport;
  readonly outcomeSelfAssessmentReports: { [outcomeId: string]: LessonOutcomeSelfAssessmentReport };
}
const initialLessonState: Partial<LessonState> = {
  outcomeSelfAssessmentReports: {}
};

function selectState<K extends keyof LessonState>(key: K, isNullable = false): OperatorFunction<Partial<LessonState>, LessonState[K]> {
  return pipe(
    pluck<LessonState, K>(key),
    skipWhile((value): value is LessonState[K] => isNullable || value == null),
    distinctUntilChanged(),
  );
}

@Injectable()
export class LessonStateService {
  private lessonStateSubject = new BehaviorSubject<Partial<LessonState>>(initialLessonState);

  protected addState<K extends keyof LessonState>(key: K, value$: Observable<LessonState[K]>): Subscription {
    return value$.subscribe(
      value => this.setState(key, value),
      this.errorState.bind(this),
    );
  }

  protected setState<K extends keyof LessonState>(key: K, value: LessonState[K]) {
    this.lessonStateSubject.next({
      ...this.lessonStateSubject.value,
      [key]: value
    });
  }


  protected errorState<K extends keyof LessonState>(error: any) {
    this.lessonStateSubject.error(error);
  }

  readonly unit$ = defer(() => this.blockState.unitContext.unit$);
  readonly block$ = defer(() => this.blockState.block$);

  readonly lesson$ = defer(() =>
    this.lessonStateSubject.pipe(selectState('lesson'))
  );
  readonly prelearningReport$ = defer(() =>
    this.lessonStateSubject.pipe(selectState('prelearningReport'))
  );
  readonly outcomeSelfAssessmentReports$ = defer(() =>
    this.lessonStateSubject.pipe(selectState('outcomeSelfAssessmentReports'))
  );
  readonly students$ = this.appState.studentsForActiveSubjectClass$;

  protected readonly assessmentParams$ = defer(() =>
    combineLatest([
      this.lesson$,
      this.appState.activeSubjectClass$
    ]).pipe(
      map(([lesson, subjectClass]) => ({
        node: lesson.id,
        class: subjectClass && subjectClass.id
      })),
      share()
    )
  );

  constructor(
    readonly appState: AppStateService,
    readonly assessmentsService: AssessmentsService,
    readonly blockState: BlockStateService
  ) {
  }

  protected prelearningAssessmentResolveQueue = new ModelResolveQueue<Resolve<LessonPrelearningAssessment, 'student'>>((candidateIds) => {
    return this.assessmentParams$.pipe(
      first(),
      switchMap(params => {
        return this.assessmentsService.queryAssessments(
          'lesson-prelearning-assessment',
          {params: {...params, student: [...candidateIds]}}
        );
      }),
      withLatestFrom(this.lesson$, this.students$),
      map(([page, lesson, students]) => {
        const candidateMap = {};
        for (const candidateId of candidateIds) {
          let assessment = page.results.find(result => modelRefId(result.student) == candidateId);
          if (assessment === undefined) {
            assessment = createPrelearningAssessment(lesson, students[candidateId]);
          }
          assessment = {...assessment, lesson: lesson, student: students[candidateId]};
          candidateMap[candidateId] = assessment;
        }
        for (const result of page.results) {
          if (!candidateMap.hasOwnProperty(modelRefId(result.student))) {
            throw new Error(`Assessment for '${modelRefId(result.student)}' was resolved, when no such student was requested`);
          }
        }
        return candidateMap;
      })
    );
  });

  readonly prelearningAssessments$ = defer(() => this.prelearningAssessmentResolveQueue.allResolved$);

  loadPrelearningAssessment(student: ModelRef<Student>, options: {force: boolean} = {force: false}) {
    return this.prelearningAssessmentResolveQueue.queue(modelRefId(student), options);
  }

  init(lessonId: string): Unsubscribable {
    const resolveQueue = this.prelearningAssessmentResolveQueue.init();

    const loadLesson = this.addState('lesson', this.block$.pipe(
      map(block => block.getLesson(lessonId))
    ));
    const loadPrelearningReport = this.addState('prelearningReport', this.lesson$.pipe(
      switchMap(lesson => this.blockState.getPrelearningReport(lesson))
    ));

    const loadSelfAssessmentReports = this.addState('outcomeSelfAssessmentReports', this.assessmentParams$.pipe(
      switchMap(params =>
        this.assessmentsService.queryReports('lesson-outcome-self-assessment', { params })
      ),
      map(page => page.resultMap((result) => modelRefId(result.node)))
    ));

    this.setState('lessonId', lessonId);
    return {
      unsubscribe: () => {
        this.lessonStateSubject.complete();
        resolveQueue.unsubscribe();
        loadLesson.unsubscribe();
        loadPrelearningReport.unsubscribe();
        loadSelfAssessmentReports.unsubscribe();
      }
    };
  }

  setPrelearningAssessmentCompletionState(student: ModelRef<Student>, completionState: CompletionState): Observable<LessonPrelearningAssessment> {
    const studentId = modelRefId(student);
    return this.prelearningAssessments$.pipe(
      map(assessments => assessments[studentId] as LessonPrelearningAssessment),
      switchMap(assessment => {
        if (assessment.createdAt != null) {
          return of(assessment);
        }
        return this.assessmentsService.saveAssessment(
          'lesson-prelearning-assessment',
          assessment
        );
      }),
      switchMap(assessment =>
        this.assessmentsService.createAttempt('lesson-prelearning-assessment', {
          assessment: assessment.id,
          completionState
        })
      ),
      switchMap(() => this.loadPrelearningAssessment(studentId, {force: true}))
    );
  }
}
