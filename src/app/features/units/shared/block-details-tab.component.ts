import {Component, Input} from '@angular/core';
import {UnitBlock} from '../../../common/model-types/unit-block';

@Component({
  selector: 'app-unit-block-details-tab',
  template: `
    <h1></h1>
  `
})
export class BlockDetailsTabComponent {
  @Input() block: UnitBlock | undefined;
}
