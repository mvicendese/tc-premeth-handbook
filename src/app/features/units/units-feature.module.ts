import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {UnitPageComponent} from './unit-page.component';
import {CommonModule} from '@angular/common';
import {UnitsSharedModule} from './shared/units-shared.module';
import {MatTabsModule} from '@angular/material/tabs';
import {BlockDrawerComponent} from './block-drawer.component';
import {MatExpansionModule} from '@angular/material/expansion';
import {ClassSharedModule} from '../classes/shared/class-shared.module';
import {ReactiveFormsModule} from '@angular/forms';
import {AssessmentsSharedModule} from '../assessments/shared/assessments-shared.module';
import {LessonExpansionComponent} from './lesson-expansion.component';
import {MatDividerModule} from '@angular/material/divider';

export const routes: Routes = [
  {
    path: ':unit_id',
    component: UnitPageComponent,
    children: [
      {
        path: 'blocks/:block_id',
        component: BlockDrawerComponent
      }
    ]
  }
];

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),

    MatTabsModule,

    MatExpansionModule,
    MatDividerModule,
    ClassSharedModule,
    UnitsSharedModule,
    AssessmentsSharedModule
  ],
  declarations: [
    UnitPageComponent,
    BlockDrawerComponent,
    LessonExpansionComponent
  ]
})
export class UnitsFeatureModule {

}
