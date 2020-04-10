import {Component, HostBinding, Input} from '@angular/core';
import {indicatorFontSize, IndicatorSize} from './loading.component';


export type TrafficIndicatorValue = 'indeterminate' | 'stop' | 'wait' | 'go';

@Component({
  selector: 'app-traffic-light',
  template: `
    <div class="indicator" [ngClass]="'indicator-status-' + _value"></div>
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

    .indicator-status-stop {
      background-color: red;
    }
    .indicator-status-wait {
      background-color: orange;
    }
    .indicator-status-go {
      background-color: green;
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
