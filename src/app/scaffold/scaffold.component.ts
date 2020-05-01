import {Component, ViewChild} from '@angular/core';
import {MatSidenav} from '@angular/material/sidenav';

@Component({
  selector: 'app-scaffold',
  template: `
    <mat-toolbar>
      <button mat-button (click)="toggleSidebar()">
        <mat-icon>menu</mat-icon>
      </button>
      <app-title></app-title>
      <div [style.flex]="'1 1'"></div>

      <app-context-menu #contextMenu="menu"></app-context-menu>
    </mat-toolbar>

    <mat-sidenav-container>
      <mat-sidenav mode="side">
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
  @ViewChild(MatSidenav) readonly sidenav: MatSidenav;

  async toggleSidebar() {
    const result = await this.sidenav.toggle();
  }

}
