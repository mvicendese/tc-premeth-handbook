import {BehaviorSubject, of} from 'rxjs';
import {ResponsePage} from '../../../common/model-base/pagination';
import {Subject, SubjectIndex} from '../../../common/model-types/subject';
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {SubjectService} from '../../../common/model-services/subject.service';
import {FormControl} from '@angular/forms';
import {map, switchMap} from 'rxjs/operators';

@Component({
  selector: 'app-subjects-selector',
  template: `
    <mat-form-field>
      <mat-label>Subject...</mat-label>
      <mat-select [formControl]="selectionControl">
        <mat-option *ngFor="let subject of values" [value]="subject.id">
            {{subject.name}}
        </mat-option>
      </mat-select>
    </mat-form-field>
  `
})
export class SubjectSelectorComponent {
  @Input() values: SubjectIndex[];

  readonly selectionControl = new FormControl(null);

  @Input()
  get value() {
    return this.values.find((item) => item.id === this.selectionControl.value);
  }
  set value(selection: SubjectIndex | null) {
    this.selectionControl.setValue(selection && selection.id);
  }
  @Output()
  get valueChange() {
    return this.selectionControl.valueChanges.pipe(
      map(value => this.values.find(item => item.id === this.selectionControl.value))
    );
  }

  @Output()
  get subjectChange() {
    return this.selectionControl.valueChanges.pipe(
      switchMap(value => {
        if (value === null) {
          return of(null);
        }
        return this.subjectService.fetch(value);
      })
    );
  }

  constructor(
    readonly subjectService: SubjectService
  ) {}
}



