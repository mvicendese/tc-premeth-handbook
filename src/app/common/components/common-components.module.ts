import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {StarRatingComponent} from './star-rating.component';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {LoadingComponent} from './loading.component';
import {TrafficLightComponent} from './traffic-light.component';
import {ReactiveFormsModule} from '@angular/forms';

import {MatInputModule} from '@angular/material/input';
import {MatCardModule} from '@angular/material/card';


@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatCardModule
  ],
  declarations: [
    StarRatingComponent,
    LoadingComponent,
    TrafficLightComponent
  ],
  exports: [
    StarRatingComponent,
    LoadingComponent,
    TrafficLightComponent,
  ]
})
export class CommonComponentsModule {

}
