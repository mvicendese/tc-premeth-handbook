import {Component, Input} from '@angular/core';
import {StudentsOverviewPageComponent} from './students-overview-page.component';
import {filter, shareReplay} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {Student} from '../../common/model-types/schools';


@Component({
  selector: 'app-student-results-container',
  template: `
    <h3>{{student.fullName}}</h3>




  `
})
export class StudentResultsContainerComponent {
  @Input()
  readonly student: Student;
}
