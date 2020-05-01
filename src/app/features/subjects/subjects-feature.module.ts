import {NgModule, Type} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Route, RouterModule, Routes, UrlMatchResult, UrlSegment} from '@angular/router';
import {ClassSharedModule} from '../classes/shared/class-shared.module';
import {SubjectPageComponent} from './subject/subject-page.component';
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
import {SubjectNodePageContainerComponent} from './subject-node-page-container.component';
import {SubjectNodePageBreadcrumbComponent} from './subject-node-page-breadcrumb.component';
import {SubjectsSharedModule} from './shared/subjects-shared.module';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {SubjectsSubjectModule} from './subject/subject.module';

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
  };
}

export const routes: Routes = [
  {
    path: '',
    component: SubjectNodePageContainerComponent,
    children: [
      subjectNodeRoute({
        type: 'subject',
        component: SubjectPageComponent
      }),
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
          {path: '', component: BlockPageComponent},
          {path: 'prelearning', component: BlockPageComponent},
          {path: 'outcomes'}
        ]
      })
    ]
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),

    MatButtonModule,
    MatIconModule,

    ClassSharedModule,

    UnitsModule,
    BlocksModule,
    LessonModule,
    LessonOutcomeModule,
    SubjectsSubjectModule,

    SubjectsSharedModule
  ],
  declarations: [
    SubjectNodePageBreadcrumbComponent,
    SubjectNodePageContainerComponent
  ],
  providers: [
    SubjectsFeatureState,
    SubjectNodeRouteResolver
  ]
})
export class SubjectsFeatureModule {}
