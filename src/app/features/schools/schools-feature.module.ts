import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';


const schoolRoutes: Routes = [
  {
    path: 'students',
    loadChildren: () => import('./students/students-feature.module')
      .then(module => module.StudentsFeatureModule)
  },
  {
    path: 'teachers',
    loadChildren: () => import('./teachers/teachers-feature.module')
      .then(module => module.TeachersFeatureModule)
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(schoolRoutes)
  ],
})
export class SchoolsFeatureModule {
}
