import {CompletionState, LessonPrelearningAssessment} from '../../../common/model-types/assessments';
import {Injectable, Provider} from '@angular/core';
import {combineLatest, defer, forkJoin, Observable, of, Unsubscribable} from 'rxjs';
import {filter, first, map, shareReplay, switchMap, switchMapTo, tap, withLatestFrom} from 'rxjs/operators';
import {Student} from '../../../common/model-types/schools';
import {LessonSchema} from '../../../common/model-types/subjects';
import {SubjectNodeRouteData} from '../subject-node-route-data';
import {LessonPrelearningReport} from '../../../common/model-types/assessment-reports';
import {StudentContextService} from '../../schools/students/student-context.service';
import {AssessmentResolveQueue} from '../assessment-resolve-queue';
import {provideSubjectNodeState} from '../subject-node-state';
import {AssessmentReportLoader} from '../assessment-report-loader';
import {AssessmentsModelApiService} from '../../../common/model-services/assessments.service';
import {LessonPrelearningAssessmentAttempt} from '../../../common/model-types/assessment-attempt';
import {SubjectNodePageContainerState} from '../subject-node-page-container-state';
import {Ref} from '../../../common/model-base/ref';

export function provideLessonState(): Provider[] {
  return [
    ...provideSubjectNodeState({
      assessmentType: 'lesson-prelearning-assessment',
      childAssessmentTypes: ['lesson-outcome-self-assessment'],
    }),
    LessonState
  ];
}

@Injectable()
export class LessonState {
  constructor(
    readonly subjectNodePageState: SubjectNodePageContainerState,
    readonly assessmentsService: AssessmentsModelApiService,
    readonly students: StudentContextService,
    readonly nodeRouteData: SubjectNodeRouteData,
    readonly assessmentResolveQueue: AssessmentResolveQueue<LessonPrelearningAssessment>,
    readonly reportLoader: AssessmentReportLoader<LessonPrelearningReport>
  ) {}

  readonly lesson$: Observable<LessonSchema> = defer(() => this.nodeRouteData.lesson$.pipe(
    filter((lesson): lesson is LessonSchema => lesson != null)
  ));

  readonly lessonPrelearningReport$: Observable<LessonPrelearningReport> = this.reportLoader.report$;
  readonly outcomeSelfAssessmentReports$ = this.reportLoader.childReportsOfType('lesson-outcome-self-assessment');

  private readonly initialAssessments$: Observable<{[candidateId: string]: LessonPrelearningAssessment}> = combineLatest([
    this.lesson$,
    this.lessonPrelearningReport$,
  ]).pipe(
    switchMap(([lesson, report]) => {
      function createInitialAssessment(candidate: Student): [string, LessonPrelearningAssessment] {
        return [candidate.id, LessonPrelearningAssessment.create({lesson, student: candidate})];
      }
      return forkJoin(
        report.candidates.map(candidate => {
          return this.students.student(candidate).pipe(first())
        })
      ).pipe(
        map((candidates: Student[]) => {
          return Object.fromEntries(candidates.map(createInitialAssessment))
        })
      )
    }),
    shareReplay(1)
  );

  readonly prelearningAssessments$ = this.lessonPrelearningReport$.pipe(
    tap(report => {
      report.candidates.forEach(candidate =>
        this.assessmentResolveQueue.loadAssessment(candidate)
      );
    }),
    switchMapTo(this.assessmentResolveQueue.assessments$),
    withLatestFrom(this.initialAssessments$),
    map(([loadedAssessments, initialAssessments]) => {
      loadedAssessments = Object.fromEntries(
        Object.entries(loadedAssessments).filter(([k, v]) => v !== undefined)
      );
      return Object.assign({}, initialAssessments, loadedAssessments);
    })
  );

  loadPrelearningAssessment(candidate: Ref<Student>, options?: {force: boolean}): Observable<LessonPrelearningAssessment> {
    return this.assessmentResolveQueue.loadAssessment(candidate, options);
  }

  init(): Unsubscribable {
    const container = this.subjectNodePageState.addSubjectNodeSource(this.lesson$);

    const resolveQueue = this.assessmentResolveQueue.init();
    const reportLoader = this.reportLoader.init();

    return {
      unsubscribe: () => {
        container.unsubscribe();
        resolveQueue.unsubscribe();
        reportLoader.unsubscribe();
      }
    };
  }

  setPrelearningAssessmentCompletionState(student: Ref<Student>, completionState: CompletionState): Promise<LessonPrelearningAssessment> {
    return this.prelearningAssessments$.pipe(
      map(assessments => assessments[student.id]),
      filter((a): a is LessonPrelearningAssessment  => a !== undefined),
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
      switchMap((assessment: LessonPrelearningAssessment) =>
        this.assessmentsService.createAttempt('lesson-prelearning-assessment', {
          assessment,
          completionState
        } as Partial<LessonPrelearningAssessmentAttempt>)
      ),
      switchMap(() => this.loadPrelearningAssessment(student, {force: true}))
    ).toPromise();
  }
}
