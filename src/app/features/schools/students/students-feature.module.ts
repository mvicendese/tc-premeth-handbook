import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatCardModule} from '@angular/material/card';
import {MatListModule} from '@angular/material/list';
import {RouterModule, Routes} from '@angular/router';
import {StudentPageComponent} from './student-page.component';
import {StudentRouteResolver} from './student-route-resolver';
import {MatTabsModule} from '@angular/material/tabs';
import {SchoolsStudentProgressModule} from './progress/progress.module';
import {StudentInfoComponent} from './student-info.component';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';

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

    MatIconModule,
    MatButtonModule,

    MatCardModule,
    MatListModule,
    MatTabsModule,

    SchoolsStudentProgressModule
  ],
  declarations: [
    StudentPageComponent,
    StudentInfoComponent
  ],
  providers: [
    StudentRouteResolver
  ]
})
export class StudentsFeatureModule {

}
