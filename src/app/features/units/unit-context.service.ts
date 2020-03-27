/* tslint:disable:no-string-literal */
import {Injectable} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {AppStateService} from '../../app-state.service';
import {distinctUntilChanged, map, startWith, switchMap} from 'rxjs/operators';
import {Observable, of} from 'rxjs';
import {ResponsePage} from '../../common/model-base/pagination';
import {Student} from '../../common/model-types/student';
import {StudentService} from '../../common/model-services/students.service';

@Injectable()
export class UnitContextService {
  readonly formGroup = new FormGroup({
    class: new FormControl('all')
  });

  constructor(
    readonly appState: AppStateService,
    readonly studentService: StudentService,
  ) {}

  get classParam$() {
    return this.formGroup.valueChanges.pipe(
      startWith([this.formGroup.value['class']]),
      map(value => value['class']),
      distinctUntilChanged()
    );
  }

  get students$(): Observable<ResponsePage<Student>> {
    return this.classParam$.pipe(
      switchMap(classQueryParam => this.studentService.students({class: classQueryParam}))
    );
  }
}
