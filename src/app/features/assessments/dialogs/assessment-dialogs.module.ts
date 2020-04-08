import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {LessonOutcomeResultDetailsDialogComponent} from './lesson-outcome-result-details.component';
import {MatDialogModule} from '@angular/material/dialog';
import {MatListModule} from '@angular/material/list';

@NgModule({
  imports: [
    CommonModule,

    MatListModule,
    MatDialogModule
  ],
  declarations: [
    LessonOutcomeResultDetailsDialogComponent
  ],
  exports: [
    LessonOutcomeResultDetailsDialogComponent
  ]
})
export class AssessmentDialogsModule {

}
