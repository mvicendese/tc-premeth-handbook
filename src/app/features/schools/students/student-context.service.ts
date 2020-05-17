import {Injectable, Provider} from '@angular/core';
import {AppStateService} from '../../../app-state.service';
import {AsyncSubject, defer, Observable, of} from 'rxjs';
import {Person, Student, SubjectClass} from '../../../common/model-types/schools';
import {filter, first, map} from 'rxjs/operators';
import {Ref} from '../../../common/model-base/ref';


@Injectable()
export class StudentContextService {
  private studentClasses = new Map<string, SubjectClass>();

  constructor(readonly appState: AppStateService) {
  }

  readonly all$ = defer(() => this.appState.allStudents$);
  readonly forActiveSubjectClass$ = defer(() => this.appState.studentsForActiveSubjectClass$);

  student(ref: Ref<Student>): Observable<Student> {
    return this.all$.pipe(
      map(students => students[ref.id]),
      filter((s): s is Student => s != null)
    );
  }

  studentClass(ref: Ref<Student>): Observable<SubjectClass> {
    if (this.studentClasses.has(ref.id)) {
      return of(this.studentClasses.get(ref.id)!);
    }

    const clsSubject = new AsyncSubject<SubjectClass>();
    clsSubject.subscribe(cls => {
      this.studentClasses.set(ref.id, cls);
    });

    this.appState.allSubjectClasses$.pipe(
      map(classes => {
        const matchClasses = classes.filter(cls => cls.hasStudent(ref));
        if (matchClasses.length === 0) {
          throw new Error('student not in any classes');
        }
        if (matchClasses.length > 2) {
          throw new Error('student in multiple classes');
        }
        return matchClasses[0];
      }),
      first()
    ).subscribe(clsSubject);
    return clsSubject;
  }

  fetch(ref: Ref<Person>): Observable<Person | null> {
    return this.student(ref as Ref<Student>).pipe(
      map(student => student || null)
    );
  }
}

export function studentContextProviders(): Provider[] {
  return [
    StudentContextService,
  ];
}

