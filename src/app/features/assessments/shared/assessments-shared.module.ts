import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {LessonPrelearningResultsComponent} from './lesson-prelearning-results.component';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatListModule} from '@angular/material/list';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {LessonOutcomeResultsComponent} from './lesson-outcome-results.component';
import {CommonComponentsModule} from '../../../common/components/common-components.module';
import {AssessmentDialogsModule} from '../dialogs/assessment-dialogs.module';
import {PrelearningAssessmentItemComponent} from './prelearning-assessment-item.component';
import {MatButtonToggleModule} from '@angular/material/button-toggle';


@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CommonComponentsModule,

    MatListModule,
    MatListModule,
    MatCheckboxModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,

    AssessmentDialogsModule
  ],
  declarations: [
    LessonPrelearningResultsComponent,
    PrelearningAssessmentItemComponent,
    LessonOutcomeResultsComponent,
  ],
  exports: [
    LessonPrelearningResultsComponent,
    LessonOutcomeResultsComponent
  ]
})
export class AssessmentsSharedModule {

}
