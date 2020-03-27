import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {CommonComponentsModule} from '../../../common/components/common-components.module';
import {LessonOutcomesComponent} from './lesson-outcomes.component';


@NgModule({
  imports: [
    CommonModule,
    CommonComponentsModule
  ],
  declarations: [
    LessonOutcomesComponent,
  ],
  exports: [
    LessonOutcomesComponent
  ]
})
export class LessonSharedModule {

}
