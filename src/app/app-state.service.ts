import {Injectable, OnInit} from '@angular/core';
import {Subject} from './common/model-types/subject';
import {BehaviorSubject, combineLatest, concat, merge, Observable, of, race, Subscription, timer} from 'rxjs';
import {delay, distinctUntilChanged, filter, first, map, pluck, switchMap, switchMapTo, tap} from 'rxjs/operators';
import {environment} from '../environments/environment';
import {getModelRefId, ModelRef} from './common/model-base/model-ref';
import {SubjectService} from './common/model-services/subject.service';
import {Student} from './common/model-types/student';
import {SubjectClassService} from './common/model-services/subject-class.service';
import {SubjectClass} from './common/model-types/subject-class';
import {SubjectResult} from './common/model-types/subject-result';
import {User} from './common/model-types/user';
import {ResponsePage} from './common/model-base/pagination';

export interface GlobalState {
  readonly user?: User;

  readonly subject?: Subject | null;
  readonly year: number;

  readonly student: Student | null;

  readonly allSubjectClasses: SubjectClass[];
  readonly allStudents?: ResponsePage<Student>;

}

@Injectable({providedIn: 'root'})
export class AppStateService {
  private readonly stateSubject = new BehaviorSubject<GlobalState>({
    year: 2020,
    student: null,
    allSubjectClasses: []
  });

  constructor(
    readonly subjectClassService: SubjectClassService,
  ) {}

  get user$(): Observable<User | undefined> {
    return this.stateSubject.pipe(pluck('user'));
  }

  get isLoggedIn$(): Observable<boolean> {
    return this.stateSubject.pipe(map(state => state.user != null));
  }

  get year$(): Observable<number> {
    return this.stateSubject.pipe(pluck('year'));
  }

  get subject$(): Observable<Subject | null> {
    return this.stateSubject.pipe(
      pluck('subject'),
      distinctUntilChanged()
    );
  }

  get allStudents$(): Observable<ResponsePage<Student>> {
    return this.stateSubject.pipe(
      map(state => state.allStudents)
    );
  }


  get allClasses$(): Observable<ReadonlyArray<SubjectClass>> {
    return this.stateSubject.pipe(
      map(state => state.allSubjectClasses)
    );
  }


  watchClasses(): Subscription {
    return combineLatest([
      this.subject$.pipe(
        distinctUntilChanged(),
        filter((s): s is Subject => s != null)
      ),
      this.year$.pipe(distinctUntilChanged())
    ]).pipe(
      switchMap(([subject, year]) => {
        return this.subjectClassService.forYear(subject, year);
      }),
      map(page => page.results /* only ever one page of classes for a given subject year */)
    ).subscribe(classes => {
      classes = classes.map(cls => cls.set('subject', this.stateSubject.value.subject));
      this.setState('allSubjectClasses', classes);
    });
  }

  setState<K extends keyof GlobalState>(key: K, value: GlobalState[K]): void {
    this.stateSubject.next({
      ...this.stateSubject.value,
      [key]: value
    });
  }
}
