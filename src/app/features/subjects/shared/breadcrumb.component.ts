import {Component, Input} from '@angular/core';
import {SubjectNode, subjectNodePath} from '../../../common/model-types/subjects';
import {Router} from '@angular/router';


@Component({
  selector: 'subjects-breadcrumb',
  template: `
    <div *ngFor="let element of pathToUnit"
         class="element-container">
      <button mat-stroked-button
              [color]="isTreeOpen ? 'primary' : null"
              (click)="handleClick(element, $event)">
        <mat-icon inline>chevron_right</mat-icon>
        <span class="element-details">
          <span class="element-type">{{element.type.toLocaleUpperCase()}}</span>
          <span>{{element.name}}</span>
        </span>
      </button>
    </div>

    <div *ngIf="isTreeOpen">
      <subjects-tree-nav [root]="leafNode">
      </subjects-tree-nav>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      align-items: start;
    }
    .element-container {
      padding-left: 1em;
    }
    .element-container mat-icon,
    .element-container .element-details {
      font-weight: 500;
      font-size: 24px;
      line-height: 48px;
    }
    .element-details {
      display: inline-block;
      position: relative;
      margin-top: 6px;
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
  isTreeOpen = false;

  @Input() leafNode: SubjectNode | undefined;

  constructor(readonly router: Router) {}

  get path(): SubjectNode[] {
    return subjectNodePath(this.leafNode);
  }

  get pathToUnit(): SubjectNode[] {
    return this.path.slice(1);
  }

  handleClick(node: SubjectNode, $event: Event) {
    if (node === this.leafNode) {
      this.isTreeOpen = !this.isTreeOpen;
    } else {
      this.router.navigate(['/subjects', node.type, node.id]).then((stuff) => {
      });
    }

  }
}
