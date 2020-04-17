import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule, Routes} from '@angular/router';

const teacherRoutes: Routes = [

];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(teacherRoutes)
  ]
})
export class TeachersFeatureModule {}
