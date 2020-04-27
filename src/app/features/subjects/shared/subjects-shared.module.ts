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
import {SubjectsTreeNavComponent} from './tree-nav.component';
import {MatTreeModule} from '@angular/material/tree';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {SubjectsBreadcrumbComponent} from './breadcrumb.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,

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
    SubjectsBreadcrumbComponent
  ],
  exports: [
    UnitResultsTableComponent,
    BlockAssessmentResultsComponent,
    SubjectSelectorComponent,
    SubjectsTreeNavComponent,
    SubjectsBreadcrumbComponent
  ]
})
export class SubjectsSharedModule {

}
