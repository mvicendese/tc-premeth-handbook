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
export class UnitPageStateService {
  private unitIdSubject = new Subject<string>();

  readonly unit$: Observable<Unit> = combineLatest([
      this.appState.subject$.pipe(
        filter((s): s is ModelSubject => s != null),
        distinctUntilChanged()
      ),
      this.unitIdSubject.pipe(distinctUntilChanged()),
    ]).pipe(
      map(([subject, unitId]) => {
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
