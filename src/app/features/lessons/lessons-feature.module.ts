import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {LessonPageComponent} from './lesson-page.component';
import {RouterModule, Routes} from '@angular/router';
import {CommonComponentsModule} from '../../common/components/common-components.module';


export const lessonRoutes: Routes = [
  {
    path: ':lesson_id',
    component: LessonPageComponent,
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(lessonRoutes),
    CommonComponentsModule
  ],
  declarations: [
    LessonPageComponent
  ]
})
export class LessonsFeatureModule {

}
