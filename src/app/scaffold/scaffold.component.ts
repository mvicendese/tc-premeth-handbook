import {Component, ViewChild} from '@angular/core';
import {MatSidenav} from '@angular/material/sidenav';

@Component({
  selector: 'app-scaffold',
  template: `
    <base-auth-context-container>
      <mat-toolbar class="mat-elevation-z10" color="primary">
        <button mat-button (click)="toggleSidebar()">
          <mat-icon>menu</mat-icon>
        </button>
        <app-title></app-title>
      <div [style.flex]="'1 1'"></div>

        <app-context-menu #contextMenu="menu"></app-context-menu>
      </mat-toolbar>

      <mat-sidenav-container>
        <mat-sidenav mode="side" class="mat-elevation-z10">
          <app-sidebar-menu></app-sidebar-menu>
        </mat-sidenav>
        <mat-sidenav-content>
          <ng-content></ng-content>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </base-auth-context-container>
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
