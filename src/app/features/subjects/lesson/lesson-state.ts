import {CompletionState, LessonPrelearningAssessment} from '../../../common/model-types/assessments';
import {Injectable} from '@angular/core';
import {BehaviorSubject, combineLatest, defer, of, Unsubscribable} from 'rxjs';
import {filter, first, map, pluck, shareReplay, switchMap, withLatestFrom} from 'rxjs/operators';
import {AppStateService} from '../../../app-state.service';
import {AssessmentsService} from '../../../common/model-services/assessments.service';
import {ModelRef, modelRefId, Resolve} from '../../../common/model-base/model-ref';
import {BlockState} from '../blocks/block-state';
import {ModelResolveQueue} from '../../../common/model-base/resolve-queue';
import {Student} from '../../../common/model-types/schools';
import {LessonSchema} from '../../../common/model-types/subjects';
import {SubjectNodeRouteContext} from '../subject-node-route-context';

@Injectable()
export class LessonState {
  private lessonSubject
    = new BehaviorSubject<LessonSchema | undefined>(undefined);

  readonly lesson$ = defer(() =>
    this.lessonSubject.asObservable()
  );

  readonly lessonId$ = defer(() => this.lesson$.pipe(pluck('id')));

  readonly prelearningReport$ =
    this.lessonId$.pipe(
      switchMap(lessonId => this.blockState.getPrelearningReport(lessonId)),
      shareReplay(1)
    );

  protected readonly assessmentParams$ = defer(() =>
    combineLatest([
      this.lessonId$,
      this.appState.activeSubjectClass$
    ]).pipe(
      map(([lesson, subjectClass]) => ({
        node: lesson,
        class: subjectClass && subjectClass.id
      }))
    )
  );

  readonly outcomeSelfAssessmentReports$ =
    this.assessmentParams$.pipe(
      switchMap(params =>
        this.assessmentsService.queryReports('lesson-outcome-self-assessment', {params})
      ),
      map(page => page.resultMap((result) => modelRefId(result.node)),
        shareReplay(1))
    );

  readonly students$ = this.appState.studentsForActiveSubjectClass$;


  constructor(
    readonly assessmentsService: AssessmentsService,
    readonly appState: AppStateService,
    readonly subjectNodeRouteData: SubjectNodeRouteContext,
    readonly blockState: BlockState,
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
            assessment = LessonPrelearningAssessment.create(lesson, students[candidateId]);
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

  loadPrelearningAssessment(student: ModelRef<Student>, options: { force: boolean } = {force: false}) {
    return this.prelearningAssessmentResolveQueue.queue(modelRefId(student), options);
  }

  init(): Unsubscribable {
    const resolveQueue = this.prelearningAssessmentResolveQueue.init();

    const loadLesson = this.subjectNodeRouteData.lesson$.subscribe(this.lessonSubject);
    const loadPrelearningReport = this.lesson$.subscribe();
    const loadSelfAssessmentReports = this.outcomeSelfAssessmentReports$.subscribe();

    return {
      unsubscribe: () => {
        resolveQueue.unsubscribe();

        loadLesson.unsubscribe();
        loadPrelearningReport.unsubscribe();
        loadSelfAssessmentReports.unsubscribe();

        this.lessonSubject.complete();
      }
    };
  }

  setPrelearningAssessmentCompletionState(student: ModelRef<Student>, completionState: CompletionState): Promise<LessonPrelearningAssessment> {
    console.log('setPrelearningCompleteState');
    const studentId = modelRefId(student);
    return this.prelearningAssessments$.pipe(
      map(assessments => assessments[studentId]),
      filter((a): a is Resolve<LessonPrelearningAssessment, 'student'> => a !== undefined),
      first(),
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
    ).toPromise();
  }
}
