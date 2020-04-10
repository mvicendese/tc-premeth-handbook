import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {LessonOutcomeResultDetailsDialogComponent} from './lesson-outcome-result-details.component';
import {MatDialogModule} from '@angular/material/dialog';
import {MatListModule} from '@angular/material/list';
import {MatButtonModule} from '@angular/material/button';

@NgModule({
  imports: [
    CommonModule,

    MatButtonModule,
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
