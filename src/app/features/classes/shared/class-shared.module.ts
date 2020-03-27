import {NgModule} from '@angular/core';
import {ClassTableFilterComponent} from './class-table-filter.component';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {MatRadioModule} from '@angular/material/radio';


@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatRadioModule
  ],
  declarations: [
    ClassTableFilterComponent
  ],
  exports: [
    ClassTableFilterComponent
  ]

})
export class ClassSharedModule {}
