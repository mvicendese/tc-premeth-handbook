import {Injectable} from '@angular/core';
import {BehaviorSubject, combineLatest, defer, Observable, Subject, Subscription, Unsubscribable} from 'rxjs';
import {AssessmentsService} from '../../../common/model-services/assessments.service';
import {AppStateService} from '../../../app-state.service';
import {Block, LessonSchema} from '../../../common/model-types/subjects';
import {distinctUntilChanged, filter, map, pluck, shareReplay} from 'rxjs/operators';
import {ModelRef, modelRefId} from '../../../common/model-base/model-ref';
import {SubjectClass} from '../../../common/model-types/schools';
import {LessonPrelearningReport} from '../../../common/model-types/assessment-reports';
import {SubjectNodeRouteContext} from '../subject-node-route-context';

@Injectable()
export class BlockState {

  constructor(
    readonly assessmentsService: AssessmentsService,
    readonly appState: AppStateService,
    readonly subjectNodeRouteData: SubjectNodeRouteContext
  ) {}

  readonly block$: Observable<Block> =
    this.subjectNodeRouteData.block$.pipe(shareReplay(1));

  readonly blockId$ = defer(() => this.block$.pipe(pluck('id')));
  readonly activeLessonId$ = defer(() =>
    this.subjectNodeRouteData.lesson$.pipe(map(lesson => lesson && lesson.id))
  );

  init(): Unsubscribable {
    const reportLoaderSubscription = combineLatest([
      this.block$,
      this.appState.activeSubjectClass$
    ]).subscribe(([block, subjectClass]) => {
      this.loadPrelearningReports(block, subjectClass);
    });

    return {
      unsubscribe: () => {
        reportLoaderSubscription.unsubscribe();
        this.prelearningReportsSubject.complete();
      }
    };
  }

  readonly prelearningReportsSubject = new BehaviorSubject<{[lessonId: string]: LessonPrelearningReport}>({});

  protected loadPrelearningReports(block: Block, subjectClass: ModelRef<SubjectClass> | null): Subscription {
    return this.assessmentsService.queryReports('lesson-prelearning-assessment', {
      params: {
        node: block,
        class: subjectClass
      }
    }).subscribe(page => {
      // Should only be one page.
      page.results.forEach(report => {
        this.prelearningReportsSubject.next({
          ...this.prelearningReportsSubject.value,
          [modelRefId(report.node)]: report
        });
      });
    });
  }

  getPrelearningReport(lesson: ModelRef<LessonSchema>): Observable<LessonPrelearningReport> {
    return this.prelearningReportsSubject.pipe(
      pluck(modelRefId(lesson)),
      filter(report => report !== undefined)
    );
  }
}
