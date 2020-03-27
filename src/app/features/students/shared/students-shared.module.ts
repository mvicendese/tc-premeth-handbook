import {UnitResultsTableComponent} from './unit-results-table.component';
import {CommonModule} from '@angular/common';
import {MatTableModule} from '@angular/material/table';
import {NgModule} from '@angular/core';


@NgModule({
  imports: [
    CommonModule,
    MatTableModule
  ],
  declarations: [
    UnitResultsTableComponent
  ],
  exports: [
    UnitResultsTableComponent
  ]
})
export class StudentsSharedModule {

}
