import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {LessonPrelearningResultsComponent} from './lesson-prelearning-results.component';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatListModule} from '@angular/material/list';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';


@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatListModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
  ],
  declarations: [
    LessonPrelearningResultsComponent
  ],
  exports: [
    LessonPrelearningResultsComponent
  ]
})
export class AssessmentsSharedModule {

}
