import {ChangeDetectionStrategy, Component, HostBinding, Input} from '@angular/core';

export type IndicatorSize = 'inline' | 'sm' | 'md' | 'lg' | 'xs';
export function indicatorFontSize(indicatorSize: IndicatorSize) {
  return {
    'inline': '2',
    'xs': '2',
    'sm': '3',
    'md': '5',
    'lg': '10',
  }[indicatorSize];
}


@Component({
  selector: 'app-loading',
  template: `
    <div></div>
    <div></div>
    <div></div>
    <div></div>
    <div></div>
    <div></div>
    <div></div>
    <div></div>
    <div></div>
    <div></div>
    <div></div>
    <div></div>
  `,
  host: {
  },
  styleUrls: [
    './loading.component.scss'
  ],

  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingComponent {

  @Input()
  size: IndicatorSize;

  @HostBinding('style.font-size.em')
  get hostFontSize() {
    return indicatorFontSize(this.size);
  }

}
