import {Component} from '@angular/core';

@Component({
  selector: 'app-scaffold',
  template: `
    <mat-sidenav-container>
      <mat-sidenav mode="side" opened>
        <app-sidebar-menu></app-sidebar-menu>
      </mat-sidenav>
      <mat-sidenav-content>
        <ng-content></ng-content>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styleUrls: [
    './scaffold.component.scss'
  ]
})
export class ScaffoldComponent {

}
