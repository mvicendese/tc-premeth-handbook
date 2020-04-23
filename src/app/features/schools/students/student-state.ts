import {Injectable} from '@angular/core';
import {BehaviorSubject, combineLatest, defer, Observable, Unsubscribable} from 'rxjs';
import {Student} from '../../../common/model-types/schools';
import {ActivatedRoute} from '@angular/router';
import {distinctUntilChanged, filter, map, switchMap} from 'rxjs/operators';
import {AssessmentsService} from '../../../common/model-services/assessments.service';
import {SubjectNode} from '../../../common/model-types/subjects';
import {LessonOutcomeSelfAssessmentProgress, LessonPrelearningAssessmentProgress} from '../../../common/model-types/assessment-progress';


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
