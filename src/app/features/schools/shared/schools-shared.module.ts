import {UnitResultsTableComponent} from './unit-results-table.component';
import {CommonModule} from '@angular/common';
import {MatTableModule} from '@angular/material/table';
import {NgModule} from '@angular/core';
import {StudentItemComponent} from './student-item.component';
import {MatListModule} from '@angular/material/list';
import {RouterModule} from '@angular/router';


@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatListModule
  ],
  declarations: [
    UnitResultsTableComponent,
    StudentItemComponent
  ],
  exports: [
    UnitResultsTableComponent,
    StudentItemComponent
  ]
})
export class SchoolsSharedModule {

}
