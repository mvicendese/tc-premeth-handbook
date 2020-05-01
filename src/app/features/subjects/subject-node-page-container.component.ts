import {Component} from '@angular/core';
import {SubjectNodePageContainerState} from './subject-node-page-container-state';

@Component({
  selector: 'subjects-node-page-container',
  template: `
    <header>
      <subjects-node-page-breadcrumb></subjects-node-page-breadcrumb>
    </header>

    <main>
      <router-outlet></router-outlet>
    </main>
  `,
  viewProviders: [
    SubjectNodePageContainerState
  ],
  styleUrls: [
    './subject-node-page-container.component.scss'
  ]
})
export class SubjectNodePageContainerComponent {

}
