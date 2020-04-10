import {Injectable} from '@angular/core';
import {BehaviorSubject, combineLatest, defer, Observable, Unsubscribable} from 'rxjs';
import {distinctUntilChanged, filter, map, pluck, switchMap} from 'rxjs/operators';
import {ModelRef} from './common/model-base/model-ref';
import {SubjectClassService} from './common/model-services/subject-class.service';
import {User} from './common/model-types/user';
import {StudentService} from './common/model-services/students.service';
import {ModelFetchQueue} from './common/model-base/fetch-queue';
import {Subject} from './common/model-types/subjects';
import {Student, SubjectClass} from './common/model-types/schools';

export interface GlobalState {
  readonly user?: User;

  readonly subject?: Subject | null;
  readonly year: number;

  readonly student: Student | null;

  readonly allSubjectClasses: SubjectClass[];
  readonly selectedClass: SubjectClass | null;
}

@Injectable({providedIn: 'root'})
export class AppStateService {
  private readonly stateSubject = new BehaviorSubject<GlobalState>({
    year: 2020,
    student: null,
    allSubjectClasses: [],
    selectedClass: null,
  });

  constructor(
    readonly subjectClassService: SubjectClassService
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

  get allSubjectClasses$(): Observable<ReadonlyArray<SubjectClass>> {
    return this.stateSubject.pipe(
      pluck('allSubjectClasses'),
      distinctUntilChanged()
    );
  }

  get activeSubjectClass$(): Observable<SubjectClass | null> {
    return this.stateSubject.pipe(
      pluck('selectedClass'),
      distinctUntilChanged()
    );
  }

  readonly allStudents$: Observable<Record<Student['id'], Student>> = defer(() =>
    this.allSubjectClasses$.pipe(
      map((classes) => this.createStudentMap(...classes))
    )
  );

  readonly studentsForActiveSubjectClass$: Observable<Record<Student['id'], Student>> = defer(() =>
    combineLatest([
      this.allSubjectClasses$,
      this.activeSubjectClass$
    ]).pipe(
      map(([allClasses, selectedClass]) => {
        if (selectedClass == null) {
          return this.createStudentMap(...allClasses);
        } else {
          return this.createStudentMap(selectedClass);
        }
      })
    )
  );

  protected createStudentMap(...subjectClasses: readonly SubjectClass[]): Record<Student['id'], Student> {
    const studentEntries = subjectClasses.flatMap((subjectClass) => {
      return subjectClass.students.map(student => [student.id, student] as [Student['id'], Student]);
    });
    return Object.fromEntries(studentEntries);
  }

  init(): Unsubscribable {
    const allClassesSubscription = combineLatest([
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
      classes = classes.map(cls => ({...cls, subject: this.stateSubject.value.subject}));
      this.setState('allSubjectClasses', classes);
    });

    return {
      unsubscribe: () => {
        allClassesSubscription.unsubscribe();
      }
    };
  }

  setState<K extends keyof GlobalState>(key: K, value: GlobalState[K]): void {
    this.stateSubject.next({
      ...this.stateSubject.value,
      [key]: value
    });
  }
}
