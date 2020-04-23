import {NgModule} from '@angular/core';
import {SelfAssessmentReportComponent} from './self-assessment-report.component';
import {SelfAssessmentResultHistogramComponent} from './self-assessment-result-histogram.component';
import {CommonModule} from '@angular/common';
import {StudentsFeatureModule} from '../../schools/students/students-feature.module';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatDividerModule} from '@angular/material/divider';
import {CommonComponentsModule} from '../../../common/components/common-components.module';
import {MatDialogModule} from '@angular/material/dialog';
import {SelfAssessmentResultDetailsDialogComponent} from './self-assessment-result-details.component';
import {MatListModule} from '@angular/material/list';
import {SchoolsSharedModule} from '../../schools/shared/schools-shared.module';
import {LessonOutcomeOverviewComponent} from './lesson-outcome-overview.component';

@NgModule({
  imports: [
    CommonModule,

    MatButtonModule,
    MatDialogModule,
    MatDividerModule,
    MatListModule,
    MatIconModule,

    CommonComponentsModule,
    SchoolsSharedModule
  ],
  declarations: [
    SelfAssessmentResultDetailsDialogComponent,
    SelfAssessmentReportComponent,
    SelfAssessmentResultHistogramComponent,
    LessonOutcomeOverviewComponent
  ],
  exports: [
    LessonOutcomeOverviewComponent,
    SelfAssessmentReportComponent
  ]
})
export class LessonOutcomeModule {

}
