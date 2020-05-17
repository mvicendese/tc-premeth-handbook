import {Inject, Injectable, InjectionToken} from '@angular/core';
import {BehaviorSubject, combineLatest, concat, defer, merge, Observable, Subject, Unsubscribable} from 'rxjs';
import {Student} from '../../../common/model-types/schools';
import {ActivatedRoute} from '@angular/router';
import {
  distinctUntilChanged,
  filter,
  first,
  map,
  pluck,
  repeat,
  shareReplay,
  skip,
  skipUntil,
  startWith,
  switchMap, switchMapTo,
  tap
} from 'rxjs/operators';
import {AssessmentsModelApiService} from '../../../common/model-services/assessments.service';
import {SubjectNode} from '../../../common/model-types/subjects';
import {
  AnyProgress,
  LessonOutcomeSelfAssessmentProgress,
  LessonPrelearningAssessmentProgress, Progress, ProgressForAssessment
} from '../../../common/model-types/assessment-progress';
import {Assessment, AssessmentType} from '../../../common/model-types/assessments';
import {StudentModelApiService} from '../../../common/model-services/schools.service';
import {Ref} from '../../../common/model-base/ref';

export const PROGRESS_LOADER_OPTIONS = new InjectionToken<ProgressLoaderOptions>('PROGRESS_LOADER_OPTIONS');

export interface ProgressLoaderOptions {
  readonly assessmentType: AssessmentType;
}

@Injectable()
export class ProgressLoader<T extends AnyProgress> {
  constructor(
    readonly assessments: AssessmentsModelApiService,
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

  protected loadProgress(student: Ref<Student>, node: Ref<SubjectNode> | null): Observable<T | null> {
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

  readonly loadProgressSubject = new Subject<AssessmentType>();

  readonly assessmentParams$ = defer(() => combineLatest([
    this.studentId$.pipe(distinctUntilChanged()),
  ]).pipe(
    map(([studentId]) => ({
      student: studentId,
      year: 2020
    }))
  ));

  readonly lessonPrelearningAssessmentProgress$: Observable<LessonPrelearningAssessmentProgress>
    = this.loadProgressSubject.pipe(
      filter(type => type === 'lesson-prelearning-assessment'),
      first(),
      switchMapTo(this.assessmentParams$),
      switchMap((params) =>
        this.assessments.queryProgresses<LessonPrelearningAssessmentProgress>('lesson-prelearning-assessment', { params })
      ),
      map(page => page.results[0]),
      shareReplay(1)
    );

  readonly lessonOutcomeSelfAssessmentProgress$: Observable<LessonOutcomeSelfAssessmentProgress>
    = this.loadProgressSubject.pipe(
      filter(type => type === 'lesson-outcome-self-assessment'),
      first(),
      switchMapTo(this.assessmentParams$),
      switchMap(params =>
          this.assessments.queryProgresses<LessonOutcomeSelfAssessmentProgress>('lesson-outcome-self-assessment', { params })
      ),
      map(page => page.results[0]),
      shareReplay(1)
    );

  readonly progress$: Observable<Progress<any>> = defer(() => merge(
    this.lessonPrelearningAssessmentProgress$,
    this.lessonOutcomeSelfAssessmentProgress$,
  ));

  constructor(
    readonly route: ActivatedRoute,
    readonly assessments: AssessmentsModelApiService
  ) {}

  init(): Unsubscribable {
    this.route.data.pipe(map(data => data.student)).subscribe(this.studentSubject);

    const progresses = this.progress$.subscribe();

    return {
      unsubscribe: () => {
        this.studentSubject.complete();
        progresses.unsubscribe();
      }
    };
  }
}


