import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs';
import {StudentService} from '../../common/model-services/students.service';
import {Student} from '../../common/model-types/schools';


@Injectable({providedIn: 'root'})
export class StudentResolverService implements Resolve<Student> {
  constructor(
    readonly studentService: StudentService
  ) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Student> | Student {
    return this.studentService.fetch(route.paramMap.get('student_id'));
  }
}
