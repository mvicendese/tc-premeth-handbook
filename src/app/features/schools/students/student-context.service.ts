import {Injectable} from '@angular/core';
import {AppStateService} from '../../../app-state.service';
import {defer, Observable, throwError} from 'rxjs';
import {ModelRef, modelRefId} from '../../../common/model-base/model-ref';
import {Student} from '../../../common/model-types/schools';
import {map} from 'rxjs/operators';
import {tryCatch} from 'rxjs/internal-compatibility';


@Injectable()
export class StudentContextService {
  constructor(readonly appState: AppStateService) {}

  readonly all$ = defer(() => this.appState.allStudents$);
  readonly forActiveSubjectClass$ = defer(() => this.appState.studentsForActiveSubjectClass$);

  student(ref: ModelRef<Student>): Observable<Student> {
    return this.all$.pipe(
      map(students => {
        const student = students[modelRefId(ref)];
        if (student === undefined) {
          throw new Error(`No student loaded with id ${modelRefId(ref)}`);
        }
        return student;
      }),
    );
  }
}
