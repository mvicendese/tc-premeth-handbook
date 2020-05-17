import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {UnitPageComponent} from './unit-page.component';
import {SubjectsSharedModule} from '../shared/subjects-shared.module';
import {MatTableModule} from '@angular/material/table';
import {RouterModule} from '@angular/router';

import {UnitResultsTableComponent} from './unit-results-table.component';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {CommonComponentsModule} from '../../../common/components/common-components.module';
import {AddUnitResultDialogComponent} from './add-unit-results-dialog.component';
import {ReactiveFormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {BaseCommentModule} from '../../base/comment/comment.module';


@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,

    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,

    CommonComponentsModule,

    BaseCommentModule,
    SubjectsSharedModule
  ],
  declarations: [
    UnitPageComponent,
    UnitResultsTableComponent,
    AddUnitResultDialogComponent
  ],
  exports: [
    UnitPageComponent,
    UnitResultsTableComponent
  ]
})
export class UnitsModule {

}
