import {Component, Input} from '@angular/core';
import {Student} from '../../../common/model-types/schools';
import {StudentContextService} from '../students/student-context.service';
import {BehaviorSubject} from 'rxjs';
import {isRefModel, Ref} from '../../../common/model-base/ref';


@Component({
  selector: 'schools-student-item',
  template: `
    <ng-container *ngIf="student$ | async as student">
      <a [routerLink]="['/schools/students', student.id]">{{student.fullName}}</a>
    </ng-container>
  `,
  styles: [`
    :host {
      border-radius: 1em;
      display: inline-block;
    }
  `]
})
export class StudentItemComponent {
  private studentSubject = new BehaviorSubject<Student | undefined>(undefined);
  readonly student$ = this.studentSubject.asObservable();

  @Input() set student(value: Ref<Student>) {
    if (isRefModel(value)) {
      this.studentSubject.next(value);
    } else {
      this.studentContext.student(value).subscribe(this.studentSubject);
    }
  }

  constructor(
    readonly studentContext: StudentContextService
  ) {}
}
