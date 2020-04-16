import {Component, Input} from '@angular/core';
import {Student} from '../../../common/model-types/schools';
import {StudentContextService} from './student-context.service';
import {BehaviorSubject} from 'rxjs';
import {ModelRef} from '../../../common/model-base/model-ref';


@Component({
  selector: 'app-student-card',
  template: `
    <ng-container *ngIf="student$ | async as student">
      <mat-list-item>
        <a [routerLink]="['/students', student.id]">{{student.fullName}}</a>
      </mat-list-item>
    </ng-container>

  `,
  styles: [`
    :host {
      border-radius: 1em;
      display: inline-block;
      width: 20rem;
    }
  `]
})
export class StudentListItemComponent {
  private studentSubject = new BehaviorSubject<Student | undefined>(undefined);
  readonly student$ = this.studentSubject.asObservable();

  @Input() set student(value: ModelRef<Student>) {
    if (typeof value === 'string') {
      this.studentContext.student(value).subscribe(this.studentSubject);
    } else {
      this.studentSubject.next(value);
    }
  }

  constructor(
    readonly studentContext: StudentContextService
  ) {}
}
