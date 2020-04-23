import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {BlockPageComponent} from './block-page.component';
import {MatExpansionModule} from '@angular/material/expansion';
import {LessonModule} from '../lesson/lesson.module';
import {SubjectsSharedModule} from '../shared/subjects-shared.module';
import {MatIconModule} from '@angular/material/icon';


@NgModule({
  imports: [
    CommonModule,

    MatIconModule,

    SubjectsSharedModule,
    LessonModule
  ],
  declarations: [
    BlockPageComponent
  ],
  exports: [
    BlockPageComponent
  ]
})
export class BlocksModule {

}
