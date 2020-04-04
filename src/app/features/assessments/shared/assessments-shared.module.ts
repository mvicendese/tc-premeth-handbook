import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {LessonPrelearningResultsComponent} from './lesson-prelearning-results.component';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatListModule} from '@angular/material/list';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {LessonOutcomeResultsComponent} from './lesson-outcome-results.component';


@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatListModule,
    MatListModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
  ],
  declarations: [
    LessonPrelearningResultsComponent,
    LessonOutcomeResultsComponent
  ],
  exports: [
    LessonPrelearningResultsComponent,
    LessonOutcomeResultsComponent
  ]
})
export class AssessmentsSharedModule {

}
