import {NgModule} from '@angular/core';
import {AppSidebarMenuComponent} from './app-sidebar-menu.component';
import {MatSidenavModule} from '@angular/material/sidenav';
import {CommonModule} from '@angular/common';
import {MatMenuModule} from '@angular/material/menu';
import {MatDialogModule} from '@angular/material/dialog';
import {SelectSubjectDialogComponent} from '../features/subjects/dialogs/select-subject-dialog.component';
import {MatTreeModule} from '@angular/material/tree';
import {ScaffoldComponent} from './scaffold.component';
import {CommonComponentsModule} from '../common/components/common-components.module';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {RouterModule} from '@angular/router';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {ReactiveFormsModule} from '@angular/forms';
import {SubjectsSharedModule} from '../features/subjects/shared/subjects-shared.module';
import {MatToolbarModule} from '@angular/material/toolbar';
import {AppTitleComponent} from './app-title.component';
import {AppContextMenuComponent} from './app-context-menu.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    CommonComponentsModule,

    MatToolbarModule,
    MatSidenavModule,
    MatMenuModule,
    MatDialogModule,
    MatTreeModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,

    SubjectsSharedModule
  ],
  declarations: [
    AppSidebarMenuComponent,
    AppContextMenuComponent,
    AppTitleComponent,
    SelectSubjectDialogComponent,
    ScaffoldComponent
  ],
  exports: [
    ScaffoldComponent
  ]
})
export class ScaffoldModule {

}
