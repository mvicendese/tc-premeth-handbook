import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SubjectOutlineComponent} from './subject-outline.component';
import {MatTreeModule} from '@angular/material/tree';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatTableModule} from '@angular/material/table';

export const routes: Routes = [
  {
    path: 'outline',
    component: SubjectOutlineComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatTreeModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule
  ],
  declarations: [
    SubjectOutlineComponent
  ]
})
export class SubjectsFeatureModule {

}
