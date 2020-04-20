import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {UnitResultsTableComponent} from './unit-results-table.component';
import {MatTableModule} from '@angular/material/table';
import {RouterModule} from '@angular/router';
import {BlockAssessmentResultsComponent} from '../blocks/block-assessment-results.component';
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
    BlockAssessmentResultsComponent,
    SubjectSelectorComponent
  ],
  exports: [
    UnitResultsTableComponent,
    BlockAssessmentResultsComponent,
    SubjectSelectorComponent
  ]
})
export class UnitsSharedModule {

}
