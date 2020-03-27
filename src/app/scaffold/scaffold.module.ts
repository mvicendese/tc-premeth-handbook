import {Injectable, NgModule} from '@angular/core';
import {AppSidebarMenuComponent} from './app-sidebar-menu.component';
import {MatSidenavModule} from '@angular/material/sidenav';
import {CommonModule} from '@angular/common';
import {MatMenuModule} from '@angular/material/menu';
import {MatDialogModule} from '@angular/material/dialog';
import {SelectSubjectDialogComponent} from './modals/select-subject-dialog.component';
import {SubjectsSharedModule} from '../features/subjects/shared/subjects-shared.module';
import {MatTreeModule} from '@angular/material/tree';
import {ScaffoldComponent} from './scaffold.component';
import {CommonComponentsModule} from '../common/components/common-components.module';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {RouterModule} from '@angular/router';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    CommonComponentsModule,
    MatSidenavModule,
    MatMenuModule,
    MatDialogModule,
    SubjectsSharedModule,
    MatTreeModule,
    MatButtonModule,
    MatIconModule
  ],
  declarations: [
    AppSidebarMenuComponent,
    SelectSubjectDialogComponent,
    ScaffoldComponent
  ],
  exports: [
    ScaffoldComponent
  ]
})
export class ScaffoldModule {

}
