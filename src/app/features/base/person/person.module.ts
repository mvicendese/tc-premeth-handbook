import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {PersonInfoComponent} from './person-info.component';
import {PersonAvatarDirective} from './person-avatar.directive';
import {RouterModule} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';


@NgModule({
  imports: [
    CommonModule,
    RouterModule,

    MatButtonModule
  ],
  declarations: [
    PersonInfoComponent,
    PersonAvatarDirective
  ],
  exports: [
    PersonInfoComponent,
    PersonAvatarDirective
  ]
})
export class PersonModule {

}
