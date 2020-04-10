import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule, Routes} from '@angular/router';

import {StudentResolverService} from './student-resolver.service';
import {StudentViewHostComponent} from './student-view-host.component';
import {StudentPageComponent} from './student-page.component';

export const studentsRoutes: Routes = [
  {
    path: ':student_id',
    resolve: {
      student: StudentResolverService
    },
    component: StudentViewHostComponent,
    children: [
      {
        path: '',
        component: StudentPageComponent
      },
    ]
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(studentsRoutes)
  ],
  providers: [
    StudentResolverService
  ],
  declarations: [
    StudentViewHostComponent,
    StudentPageComponent
  ]
})
export class StudentsFeatureModule {}
