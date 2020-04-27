import {Component, Input} from '@angular/core';
import {SubjectNode, subjectNodePath} from '../../../common/model-types/subjects';


@Component({
  selector: 'subjects-breadcrumb',
  template: `
    <ng-container *ngFor="let element of pathToUnit">
      <h2>
        <mat-icon inline>chevron_right</mat-icon>
        <span class="element-details">
          <span class="element-type">{{element.type.toLocaleUpperCase()}}</span>
          <span>{{element.name}}</span>
        </span>
      </h2>
    </ng-container>
  `,
  styles: [`
    :host {
      margin-top: 6px !important;
    }

    :host, h2 {
      display: flex;
      align-items: center;
      margin: 0;
      font: 500 24px/48px Roboto, "Helvetica Neue", sans-serif
    }
    .element-details {
      display: block;
      position: relative;
    }
    .element-details > .element-type {
      position: absolute;
      font-size: 10px;
      line-height: 10px;
      color: #4f4f4f;
      top: 4px;
    }
  `]
})
export class SubjectsBreadcrumbComponent {
  @Input() leafNode: SubjectNode | undefined;

  get path(): SubjectNode[] {
    return subjectNodePath(this.leafNode);
  }

  get pathToUnit(): SubjectNode[] {
    return this.path.slice(1);
  }


}
