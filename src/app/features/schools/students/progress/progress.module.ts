import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {LessonOutcomeSelfAssessmentTabComponent} from './lesson-outcome-self-assessment-tab.component';
import {PrelearningAssessmentTabComponent} from './prelearning-assessment-tab.component';
import {SubjectsProgressOverviewTabComponent} from './overview-tab.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    SubjectsProgressOverviewTabComponent,
    LessonOutcomeSelfAssessmentTabComponent,
    PrelearningAssessmentTabComponent
  ],
  exports: [
    SubjectsProgressOverviewTabComponent,
    LessonOutcomeSelfAssessmentTabComponent,
    PrelearningAssessmentTabComponent
  ]
})
export class SchoolsStudentProgressModule {
}
