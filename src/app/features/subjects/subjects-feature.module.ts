import {NgModule, Type} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Route, RouterModule, Routes, UrlMatchResult, UrlSegment} from '@angular/router';
import {ClassSharedModule} from '../classes/shared/class-shared.module';
import {SubjectOverviewComponent} from './subject-overview.component';
import {SubjectNodeRouteResolver} from './subject-node-route-resolver.service';
import {UnitsModule} from './units/units.module';
import {BlocksModule} from './blocks/blocks.module';
import {LessonModule} from './lesson/lesson.module';
import {LessonOutcomeModule} from './lesson-outcome/lesson-outcome.module';
import {UnitPageComponent} from './units/unit-page.component';
import {BlockPageComponent} from './blocks/block-page.component';
import {SubjectNodeType} from '../../common/model-types/subjects';
import {LessonPageComponent} from './lesson/lesson-page.component';
import {SubjectsFeatureState} from './subjects-feature-state';

export function subjectNodeRoute({type, component, children}: {
  type: SubjectNodeType;
  component: Type<any>;
  children?: Routes;
}): Route {
  return {
    path: `${type}/:node_id`,
    component,
    resolve: {
      node: SubjectNodeRouteResolver
    },
    children
  }
}

export const routes: Routes = [
  {
    path: '',
    resolve: {
      node: SubjectNodeRouteResolver
    },
  },
  subjectNodeRoute({
    type: 'unit',
    component: UnitPageComponent,
  }),
  subjectNodeRoute({
    type: 'block',
    component: BlockPageComponent,
  }),
  subjectNodeRoute({
    type: 'lesson',
    component: LessonPageComponent,
    children: [
      { path: '', component: BlockPageComponent },
      { path: 'prelearning', component: BlockPageComponent },
      { path: 'outcomes'}
    ]
  })
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),

    ClassSharedModule,

    UnitsModule,
    BlocksModule,
    LessonModule,
    LessonOutcomeModule,
  ],
  declarations: [
    SubjectOverviewComponent,
  ],
  providers: [
    SubjectsFeatureState,
    SubjectNodeRouteResolver
  ]
})
export class SubjectsFeatureModule {}
