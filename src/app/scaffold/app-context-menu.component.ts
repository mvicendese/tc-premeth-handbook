import {Component, EventEmitter, Output, ViewChild} from '@angular/core';
import {MatMenu} from '@angular/material/menu';

@Component({
  selector: 'app-context-menu',
  template: `
    <mat-menu>
      <button mat-menu-item>
        <mat-icon></mat-icon>
        <span>Subject...</span>
      </button>
      <button mat-menu-item>
        <mat-icon></mat-icon>
        <span>Class...</span>
      </button>

      <button mat-menu-item>
        <mat-icon></mat-icon>
        <span>Logout</span>
      </button>
    </mat-menu>
  `,
  exportAs: 'menu'
})
export class AppContextMenuComponent {
  @ViewChild(MatMenu, {static: true}) menu: MatMenu | undefined;
}
