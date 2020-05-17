import {Component, Input} from '@angular/core';
import {Student} from '../../../common/model-types/schools';
import {FormControl, FormGroup} from '@angular/forms';
import {SubjectNode, Unit} from '../../../common/model-types/subjects';


@Component({
  selector: 'subjects-add-unit-results-dialog',
  template: `
    <form [formGroup]="formGroup">
      <mat-form-field appearance="fill">
        <mat-label>Mark</mat-label>
        <input type="number" formControlName="rating">
      </mat-form-field>
      
      <mat-form-field appearance="standard">
        <mat-label>Comment</mat-label>
        <app-comment-input formControlName="comment"></app-comment-input>
      </mat-form-field>
    </form>
  `,
  styles: [`
    :host {
      display: flex;
      width: 100%;
    }
  `]
})
export class AddUnitResultDialogComponent {
  @Input()
  readonly student: Student;

  @Input()
  readonly unit: Unit;

  readonly formGroup = new FormGroup({
    rating: new FormControl(),
    comment: new FormControl()
  })

}
