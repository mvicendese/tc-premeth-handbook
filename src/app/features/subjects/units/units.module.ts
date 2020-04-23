import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {UnitPageComponent} from './unit-page.component';
import {SubjectsSharedModule} from '../shared/subjects-shared.module';


@NgModule({
  imports: [
    CommonModule,
    SubjectsSharedModule
  ],
  declarations: [
    UnitPageComponent
  ],
  exports: [
    UnitPageComponent
  ]
})
export class UnitsModule {

}
