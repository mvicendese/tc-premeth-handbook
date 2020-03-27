import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {UnitResultsTableComponent} from './unit-results-table.component';
import {MatTableModule} from '@angular/material/table';
import {RouterModule} from '@angular/router';
import {BlockAssessmentsComponent} from './block-assessments.component';
import {BlockDetailsTabComponent} from './block-details-tab.component';
import {AssessmentsSharedModule} from '../../assessments/shared/assessments-shared.module';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
  ],
  declarations: [
    UnitResultsTableComponent,
    BlockAssessmentsComponent,
    BlockDetailsTabComponent,
  ],
  exports: [
    UnitResultsTableComponent,
    BlockAssessmentsComponent,
    BlockDetailsTabComponent,
  ]
})
export class UnitsSharedModule {

}
