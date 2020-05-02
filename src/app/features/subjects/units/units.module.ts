import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {UnitPageComponent} from './unit-page.component';
import {SubjectsSharedModule} from '../shared/subjects-shared.module';
import {MatTableModule} from '@angular/material/table';
import {RouterModule} from '@angular/router';

import {UnitResultsTableComponent} from './unit-results-table.component';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';


@NgModule({
  imports: [
    CommonModule,
    RouterModule,

    MatButtonModule,
    MatIconModule,
    MatTableModule,

    SubjectsSharedModule
  ],
  declarations: [
    UnitPageComponent,
    UnitResultsTableComponent
  ],
  exports: [
    UnitPageComponent,
    UnitResultsTableComponent
  ]
})
export class UnitsModule {

}
