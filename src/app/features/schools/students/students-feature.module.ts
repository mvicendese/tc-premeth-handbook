import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {StudentProgressTabComponent} from './student-progress-tab.component';
import {MatCardModule} from '@angular/material/card';
import {MatListModule} from '@angular/material/list';
import {RouterModule, Routes} from '@angular/router';
import {StudentPageComponent} from './student-page.component';
import {StudentResolver} from './student-resolver';
import {MatTabsModule} from '@angular/material/tabs';

const studentRoutes: Routes = [
  {
    path: ':student_id',
    component: StudentPageComponent,
    resolve: {
      student: StudentResolver
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
    StudentPageComponent
  ],
  providers: [
    StudentResolver
  ]
})
export class StudentsFeatureModule {

}
