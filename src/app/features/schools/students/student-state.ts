import {Inject, Injectable, InjectionToken} from '@angular/core';
import {BehaviorSubject, combineLatest, defer, Observable, Unsubscribable} from 'rxjs';
import {Student} from '../../../common/model-types/schools';
import {ActivatedRoute} from '@angular/router';
import {distinctUntilChanged, filter, map, pluck, switchMap} from 'rxjs/operators';
import {AssessmentsService} from '../../../common/model-services/assessments.service';
import {SubjectNode} from '../../../common/model-types/subjects';
import {
  AnyProgress,
  LessonOutcomeSelfAssessmentProgress,
  LessonPrelearningAssessmentProgress
} from '../../../common/model-types/assessment-progress';
import {ModelRef} from '../../../common/model-base/model-ref';
import {AssessmentType} from '../../../common/model-types/assessments';
import {StudentService} from '../../../common/model-services/students.service';

export const PROGRESS_LOADER_OPTIONS = new InjectionToken<ProgressLoaderOptions>('PROGRESS_LOADER_OPTIONS');

export interface ProgressLoaderOptions {
  readonly assessmentType: AssessmentType;
}

@Injectable()
export class ProgressLoader<T extends AnyProgress> {
  constructor(
    readonly assessments: AssessmentsService,
    readonly route: ActivatedRoute,
    @Inject(PROGRESS_LOADER_OPTIONS)
    readonly options: ProgressLoaderOptions
  ) {}

  get assessmentType(): T['assessmentType'] {
    return this.options.assessmentType;
  }

  readonly progress$ = defer(() =>
    combineLatest([
      this.route.data.pipe(pluck('student'), filter((s): s is Student => s != null)),
    ])
  );

  protected loadProgress(student: ModelRef<Student>, node: ModelRef<SubjectNode> | null): Observable<T | null> {
    return this.assessments.fetchProgress(this.assessmentType, {
      params: {student, node}
    });
  }
}


@Injectable()
export class StudentState {
  private readonly studentSubject = new BehaviorSubject<Student | undefined>(undefined);
  private readonly subjectNodeSubject = new BehaviorSubject<SubjectNode | undefined>(undefined);

  readonly studentId$ = defer(() =>
    this.studentSubject.pipe(filter((s): s is Student => s != null))
  );

  readonly subjectNode$ = defer(() =>
    this.subjectNodeSubject.pipe(filter((n): n is SubjectNode => n != null))
  );

  readonly assessmentParams$ = combineLatest([
    this.studentId$.pipe(distinctUntilChanged()),
  ]).pipe(
    map(([studentId]) => ({
      student: studentId,
      year: 2020
    }))
  );

  readonly lessonPrelearningAssessmentProgress$: Observable<LessonPrelearningAssessmentProgress>
    = this.assessmentParams$.pipe(
      switchMap(params =>
        this.assessments.queryProgresses<LessonPrelearningAssessmentProgress>('lesson-prelearning-assessment', { params })
      ),
      map(page => page.results[0])
    );

  readonly lessonOutcomeSelfAssessmentProgress$: Observable<LessonOutcomeSelfAssessmentProgress>
    = this.assessmentParams$.pipe(
      switchMap(params =>
          this.assessments.queryProgresses<LessonOutcomeSelfAssessmentProgress>('lesson-outcome-self-assessment', { params })
      ),
      map(page => page.results[0])
    );

  constructor(
    readonly route: ActivatedRoute,
    readonly assessments: AssessmentsService
  ) {}

  init(): Unsubscribable {
    this.route.data.pipe(map(data => data.student)).subscribe(this.studentSubject);

    return {
      unsubscribe: () => {
        this.studentSubject.complete();
      }
    }
  }
}
