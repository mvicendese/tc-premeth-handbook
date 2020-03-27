import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {StarRatingComponent} from './star-rating.component';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {LoadingComponent} from './loading.component';


@NgModule({
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule
  ],
  declarations: [
    StarRatingComponent,
    LoadingComponent
  ],
  exports: [
    StarRatingComponent,
    LoadingComponent
  ]
})
export class CommonComponentsModule  {

}
