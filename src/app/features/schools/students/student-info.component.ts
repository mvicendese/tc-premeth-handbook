import {Component, Input} from '@angular/core';
import {Student} from '../../../common/model-types/schools';

@Component({
  selector: 'schools-student-info',
  template: `
    <div class="first-line">
      <h1>{{student.fullName}}</h1>
      <div class="separator"></div>
      <a mat-raised-button [href]="student.compassLink">
        <mat-icon>open_in_new</mat-icon> Open in compass
      </a>
    </div>
    <div class="subline">
      <h2><em>{{student.studentCode}}</em></h2>
      <span class="info">year level: {{student.yearLevel}} ({{student.group}})</span>
    </div>
  `,
  styles: [`
    .first-line {
      display: flex;
      width: 70%;
      align-items: baseline;
    }
    
    .separator {
      flex-grow: 1;
    }
  `]
})
export class StudentInfoComponent {
  @Input() student: Student;
}
