import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {BlockDrawerComponent} from './block-drawer.component';
import {MatExpansionModule} from '@angular/material/expansion';
import {LessonModule} from '../lesson/lesson.module';


@NgModule({
  imports: [
    CommonModule,
    MatExpansionModule,

    LessonModule
  ],
  declarations: [
    BlockDrawerComponent
  ],
  exports: [
    BlockDrawerComponent
  ]
})
export class BlocksModule {

}
