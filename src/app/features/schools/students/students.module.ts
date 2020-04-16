import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {StudentProgressComponent} from './student-progress.component';
import {StudentListItemComponent} from './student-list-item.component';
import {MatCardModule} from '@angular/material/card';
import {MatListModule} from '@angular/material/list';
import {RouterModule} from '@angular/router';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,

    MatCardModule,
    MatListModule
  ],
  declarations: [
    StudentProgressComponent,
    StudentListItemComponent
  ],
  exports: [
    StudentProgressComponent,
    StudentListItemComponent
  ]

})
export class StudentsModule {

}
