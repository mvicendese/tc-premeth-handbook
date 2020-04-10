import {Component, Inject, Injectable, OnDestroy, Optional, Output} from '@angular/core';
import {AppStateService} from '../../../app-state.service';
import {shareReplay} from 'rxjs/operators';
import {ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR} from '@angular/forms';
import {Subscription} from 'rxjs';


@Component({
  selector: 'app-classes-table-filter',
  template: `
    <label>Show results for...</label>
    <mat-radio-group aria-label="Select class" [formControl]="filterControl" (blur)="onTouch()">
      <mat-radio-button value="all">All students</mat-radio-button>
      <mat-radio-button *ngFor="let cls of allSubjectClasses$ | async"
                        [value]="cls.id">
        {{cls.classCode}}
      </mat-radio-button>
    </mat-radio-group>
  `,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: ClassTableFilterComponent, multi: true }
  ]
})
export class ClassTableFilterComponent implements ControlValueAccessor, OnDestroy {
  private subscriptions: Subscription[] = [];

  readonly filterControl = new FormControl('all');
  readonly allSubjectClasses$ = this.appState.allSubjectClasses$.pipe(
    shareReplay(1)
  );

  onTouch = () => undefined;

  constructor(
    readonly appState: AppStateService
  ) {}

  ngOnDestroy() {
    this.subscriptions
      .filter(subscription => !subscription.closed)
      .forEach(subscription => subscription.unsubscribe());
  }

  registerOnChange(fn: any): void {
    this.subscriptions.push(this.filterControl.valueChanges.subscribe(fn));
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  writeValue(obj: any): void {
    if (obj !== 'all-schools') {

    }
    this.filterControl.setValue(obj);
  }

}
