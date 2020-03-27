import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {SubjectSelectorComponent} from './subject-selector.component';
import {MatFormFieldModule} from '@angular/material/form-field';
import {ReactiveFormsModule} from '@angular/forms';
import {MatSelectModule} from '@angular/material/select';


@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  declarations: [
    SubjectSelectorComponent
  ],
  exports: [
    SubjectSelectorComponent
  ]
})
export class SubjectsSharedModule {}
