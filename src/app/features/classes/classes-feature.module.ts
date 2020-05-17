import {InjectionToken, NgModule} from '@angular/core';
import {Resolve, RouterModule, Routes} from '@angular/router';
import {CommonModule} from '@angular/common';
import {StudentsOverviewPageComponent} from './students-overview-page.component';
import {MatCardModule} from '@angular/material/card';
import {MatTableModule} from '@angular/material/table';
import {SchoolsSharedModule} from '../schools/shared/schools-shared.module';
import {SubjectsSharedModule} from '../subjects/shared/subjects-shared.module';
import {SubjectClass} from '../../common/model-types/schools';
import {MatButtonModule} from '@angular/material/button';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {ReactiveFormsModule} from '@angular/forms';
import {StudentResultsContainerComponent} from './student-results-container.component';


export const RESOLVE_SUBJECT_CLASS = new InjectionToken<Resolve<SubjectClass>>('RESOLVE_SUBJECT_CLASS');

export const routes: Routes = [
  {
    path: ':class_id',
    resolve: {
      subjectClass: RESOLVE_SUBJECT_CLASS
    },
    component: StudentsOverviewPageComponent
  }
];

@NgModule({

  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,

    MatAutocompleteModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatButtonModule,

    SchoolsSharedModule,
    SubjectsSharedModule
  ],
  declarations: [
    StudentsOverviewPageComponent,
    StudentResultsContainerComponent
  ]
})
export class ClassesFeatureModule {}
