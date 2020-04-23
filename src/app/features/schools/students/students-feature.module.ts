import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {StudentProgressTabComponent} from './student-progress-tab.component';
import {MatCardModule} from '@angular/material/card';
import {MatListModule} from '@angular/material/list';
import {RouterModule, Routes} from '@angular/router';
import {StudentPageComponent} from './student-page.component';
import {StudentRouteResolver} from './student-route-resolver';
import {MatTabsModule} from '@angular/material/tabs';
import {StudentPrelearningAssessmentProgressComponent} from './student-prelearning-assessment-progress.component';
import {StudentLessonOutcomeSelfAssessmentProgressComponent} from './student-lesson-outcome-self-assessment-progress.component';

const studentRoutes: Routes = [
  {
    path: ':student_id',
    component: StudentPageComponent,
    resolve: {
      student: StudentRouteResolver
    },
    children: [
      {
        path: 'progress'
      }
    ]
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(studentRoutes),

    MatCardModule,
    MatListModule,
    MatTabsModule
  ],
  declarations: [
    StudentProgressTabComponent,
    StudentPrelearningAssessmentProgressComponent,
    StudentLessonOutcomeSelfAssessmentProgressComponent,
    StudentPageComponent
  ],
  providers: [
    StudentRouteResolver
  ]
})
export class StudentsFeatureModule {

}
