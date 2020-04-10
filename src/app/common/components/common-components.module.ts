import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {StarRatingComponent} from './star-rating.component';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {LoadingComponent} from './loading.component';
import {TrafficLightComponent} from './traffic-light.component';


@NgModule({
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule
  ],
  declarations: [
    StarRatingComponent,
    LoadingComponent,
    TrafficLightComponent
  ],
  exports: [
    StarRatingComponent,
    LoadingComponent,
    TrafficLightComponent
  ]
})
export class CommonComponentsModule  {

}
