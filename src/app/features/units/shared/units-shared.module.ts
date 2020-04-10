import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {UnitResultsTableComponent} from './unit-results-table.component';
import {MatTableModule} from '@angular/material/table';
import {RouterModule} from '@angular/router';
import {BlockAssessmentsComponent} from './block-assessments.component';
import {SubjectSelectorComponent} from './subject-selector.component';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
  ],
  declarations: [
    UnitResultsTableComponent,
    BlockAssessmentsComponent,
    SubjectSelectorComponent
  ],
  exports: [
    UnitResultsTableComponent,
    BlockAssessmentsComponent,
    SubjectSelectorComponent
  ]
})
export class UnitsSharedModule {

}
