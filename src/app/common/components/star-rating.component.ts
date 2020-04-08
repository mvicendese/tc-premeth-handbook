import {Component, EventEmitter, Input, Output} from '@angular/core';
import {BehaviorSubject} from 'rxjs';


@Component({
  selector: 'app-star-rating',
  template: `
    <button mat-icon-button
            *ngFor="let i of [0, 1, 2, 3, 4]"
            (click)="commit()">
      <mat-icon (mouseenter)="setCurrentValue(i)"
                (mouseleave)="resetCurrentValue()">
        {{
            currentValueSubject.value != null && i <= currentValueSubject.value
                ? 'star'
                : 'star_outline'
        }}
      </mat-icon>
    </button>
  `
})
export class StarRatingComponent {
  private _disabled: boolean;

  @Input() set disabled(value: boolean | string) {
    this._disabled = (value === '') || !!value;
  }
  get disabled() {
    return this._disabled;
  }

  readonly currentValueSubject = new BehaviorSubject<number | null>(null);

  private lastCommittedValue: number;
  @Input()
  set value(value: number | null) {
    this.currentValueSubject.next(this.lastCommittedValue = value);
  }
  @Output() valueChange = new EventEmitter<number>();

  setCurrentValue(value: number) {
    if (!this.disabled) {
      this.currentValueSubject.next(value);
    }
  }

  resetCurrentValue() {
    this.currentValueSubject.next(this.lastCommittedValue);
  }

  commit() {
    if (!this.disabled) {
      this.valueChange.next(this.lastCommittedValue = this.currentValueSubject.value);
    }
  }
}
