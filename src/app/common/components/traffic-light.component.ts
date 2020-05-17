import {Component, HostBinding, Input} from '@angular/core';
import {indicatorFontSize, IndicatorSize} from './loading.component';


export type TrafficIndicatorValue = 'indeterminate' | 'stop' | 'wait' | 'go';

@Component({
  selector: 'app-traffic-light',
  template: `
    <div [ngSwitch]="_value" [ngClass]="'indicator-status-' + _value">
      <mat-icon *ngSwitchCase="'indeterminate'">add_circle</mat-icon>
      <mat-icon *ngSwitchCase="'stop'">error</mat-icon>
      <mat-icon *ngSwitchCase="'wait'">warning</mat-icon>
      <mat-icon *ngSwitchCase="'go'">check_circle</mat-icon>
    </div>
  `,
  styles: [`
    :host {
      width: 1em;
      height: 1em;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .indicator {
      width: 0.3em;
      height: 0.3em;
      background-color: #d5d5d5;
      border-radius: 0.2em;
    }

    .indicator-status-indeterminate > * {
      color: #d5d5d5;
    }

    .indicator-status-stop > * {
      color: red;
    }
    .indicator-status-wait > * {
      color: orange;
    }
    .indicator-status-go > * {
      color: green;
    }
  `]
})
export class TrafficLightComponent {
  _value: TrafficIndicatorValue;

  @Input() set value(value: TrafficIndicatorValue) {
    this._value = value || 'indeterminate';
  }

  @Input() size: IndicatorSize;

  @HostBinding('style.font-size.em')
  get hostFontSize() {
    return indicatorFontSize(this.size || 'inline');
  }
}
