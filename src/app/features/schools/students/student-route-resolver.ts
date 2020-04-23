import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router';
import {Student} from '../../../common/model-types/schools';
import {AppStateService} from '../../../app-state.service';
import {Observable} from 'rxjs';
import {filter, first, map, tap} from 'rxjs/operators';
import {StudentContextService} from './student-context.service';

@Injectable()
export class StudentRouteResolver implements Resolve<Student> {
  constructor(
    readonly studentContext: StudentContextService
  ) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Student> {
    return this.studentContext.all$.pipe(
      map(students => {
        const studentId = route.paramMap.get('student_id');
        if (studentId == null) {
          throw new Error('No student id in params');
        }
        return students[studentId];
      }),
      filter((student): student is Student => student != null),
      first(),
      tap(student => console.log('resolved', student))
    );
  }
}
