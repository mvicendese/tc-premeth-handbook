import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
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
import {LessonOverviewTabComponent} from './lesson-overview-tab.component';
import {LessonPrelearningTabComponent} from './lesson-prelearning-tab.component';
import {LessonOutcomesTabComponent} from './lesson-outcomes-tab.component';
import {LessonPageComponent} from './lesson-page.component';
import {MatExpansionModule} from '@angular/material/expansion';
import {PrelearningOverviewComponent} from './prelearning-overview.component';

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
    MatExpansionModule,

    LessonOutcomeModule
  ],
  declarations: [
    PrelearningOverviewComponent,
    PrelearningResultComponent,
    PrelearningResultItemComponent,
    LessonOverviewTabComponent,
    LessonPrelearningTabComponent,
    LessonOutcomesTabComponent,

    LessonPageComponent
  ],
})
export class LessonModule {

}
