import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {LessonExpansionComponent} from './lesson-expansion.component';
import {MatTabsModule} from '@angular/material/tabs';
import {PrelearningResultComponent} from './prelearning-results.component';
import {PrelearningResultItemComponent} from './prelearning-result-item.component';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatListModule} from '@angular/material/list';
import {LessonOutcomeModule} from '../lesson-outcome/lesson-outcome.module';
import {ReactiveFormsModule} from '@angular/forms';
import {CommonComponentsModule} from '../../../common/components/common-components.module';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatIconModule} from '@angular/material/icon';

@NgModule({
  imports: [
    CommonModule,
    CommonComponentsModule,
    ReactiveFormsModule,

    MatCheckboxModule,
    MatIconModule,
    MatTabsModule,
    MatListModule,
    MatButtonToggleModule,

    LessonOutcomeModule
  ],
  exports: [
    LessonExpansionComponent
  ],
  declarations: [
    PrelearningResultComponent,
    PrelearningResultItemComponent,
    LessonExpansionComponent
  ],
})
export class LessonModule {

}
