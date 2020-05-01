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
import {SubjectsTreeNavComponent, TreeNavExtendLayoutDirective} from './tree-nav.component';
import {MatTreeModule} from '@angular/material/tree';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {PortalModule} from '@angular/cdk/portal';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,

    PortalModule,

    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatTableModule,
    MatTreeModule,
  ],
  declarations: [
    UnitResultsTableComponent,
    BlockAssessmentResultsComponent,
    SubjectSelectorComponent,
    SubjectsTreeNavComponent,

    TreeNavExtendLayoutDirective
  ],
  exports: [
    UnitResultsTableComponent,
    BlockAssessmentResultsComponent,
    SubjectSelectorComponent,
    SubjectsTreeNavComponent,
  ]
})
export class SubjectsSharedModule {

}
