import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router';
import {Student} from '../../../common/model-types/schools';
import {AppStateService} from '../../../app-state.service';
import {Observable} from 'rxjs';
import {filter, first, map, tap} from 'rxjs/operators';
import {StudentContextService} from './student-context.service';

@Injectable()
export class StudentResolver implements Resolve<Student> {
  constructor(
    readonly studentContext: StudentContextService
  ) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Student> {
    console.log('resolving...');
    return this.studentContext.all$.pipe(
      map(students => students[route.paramMap.get('student_id')]),
      filter((student): student is Student => student != null),
      first(),
      tap(student => console.log('resolved', student))
    );
  }
}
