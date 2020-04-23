import {CompletionState, LessonPrelearningAssessment} from '../../../common/model-types/assessments';
import {Injectable, Provider} from '@angular/core';
import {combineLatest, forkJoin, Observable, of, Unsubscribable} from 'rxjs';
import {filter, first, map, shareReplay, switchMap, tap, withLatestFrom} from 'rxjs/operators';
import {ModelRef, modelRefId} from '../../../common/model-base/model-ref';
import {Student} from '../../../common/model-types/schools';
import {LessonSchema} from '../../../common/model-types/subjects';
import {SubjectNodeRouteData} from '../subject-node-route-data';
import {LessonPrelearningReport} from '../../../common/model-types/assessment-reports';
import {StudentContextService} from '../../schools/students/student-context.service';
import {AssessmentResolveQueue} from '../assessment-resolve-queue';
import {provideSubjectNodeState} from '../subject-node-state';
import {AssessmentReportLoader} from '../assessment-report-loader';
import {AssessmentsService} from '../../../common/model-services/assessments.service';
import {LessonPrelearningAssessmentAttempt} from '../../../common/model-types/assessment-attempt';

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
    readonly assessmentsService: AssessmentsService,
    readonly students: StudentContextService,
    readonly nodeRouteData: SubjectNodeRouteData,
    readonly assessmentResolveQueue: AssessmentResolveQueue<LessonPrelearningAssessment>,
    readonly reportLoader: AssessmentReportLoader<LessonPrelearningReport>
  ) {}

  readonly lesson$: Observable<LessonSchema> = this.nodeRouteData.lesson$;

  readonly lessonPrelearningReport$: Observable<LessonPrelearningReport> = this.reportLoader.report$;
  readonly outcomeSelfAssessmentReports$ = this.reportLoader.childReportsOfType('lesson-outcome-self-assessment');

  private readonly initialAssessments$: Observable<{[candidateId: string]: LessonPrelearningAssessment}> = combineLatest([
    this.lesson$,
    this.lessonPrelearningReport$,
  ]).pipe(
    switchMap(([lesson, report]) => {
      function createInitialAssessment(candidate: Student): [string, LessonPrelearningAssessment] {
        return [modelRefId(candidate), LessonPrelearningAssessment.create(lesson, candidate)];
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

  readonly prelearningAssessments$ = this.assessmentResolveQueue.assessments$.pipe(
    withLatestFrom(this.initialAssessments$),
    map(([loadedAssessments, initialAssessments]) => {
      loadedAssessments = Object.fromEntries(
        Object.entries(loadedAssessments).filter(([k, v]) => v !== undefined)
      );
      return Object.assign({}, initialAssessments, loadedAssessments);
    })
  );

  loadPrelearningAssessment(candidateId: ModelRef<Student>, options?: {force: boolean}): Observable<LessonPrelearningAssessment> {
    return this.assessmentResolveQueue.loadAssessment(modelRefId(candidateId), options);
  }

  init(): Unsubscribable {
    const resolveQueue = this.assessmentResolveQueue.init();
    const reportLoader = this.reportLoader.init();
    this.initialAssessments$.subscribe(() => console.log('initial assessments'));

    return {
      unsubscribe: () => {
        resolveQueue.unsubscribe();
        reportLoader.unsubscribe();
      }
    };
  }

  setPrelearningAssessmentCompletionState(student: ModelRef<Student>, completionState: CompletionState): Promise<LessonPrelearningAssessment> {
    const studentId = modelRefId(student);

    return this.prelearningAssessments$.pipe(
      map(assessments => assessments[studentId]),
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
          assessment: assessment.id,
          completionState
        } as Partial<LessonPrelearningAssessmentAttempt>)
      ),
      switchMap(() => this.loadPrelearningAssessment(studentId, {force: true}))
    ).toPromise();
  }
}
