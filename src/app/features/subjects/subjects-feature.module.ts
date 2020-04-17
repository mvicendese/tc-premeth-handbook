import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule, Routes, UrlMatchResult, UrlSegment} from '@angular/router';
import {ClassSharedModule} from '../classes/shared/class-shared.module';
import {SubjectOverviewComponent} from './subject-overview.component';
import {SubjectNodeHostComponent} from './subject-node-host.component';
import {SubjectNodeResolver} from './subject-node-resolver';
import {SubjectState} from './subject-state';
import {UnitsModule} from './units/units.module';
import {BlocksModule} from './blocks/blocks.module';
import {LessonModule} from './lesson/lesson.module';
import {LessonOutcomeModule} from './lesson-outcome/lesson-outcome.module';
import {SubjectNodeType} from '../../common/model-types/subjects';
import {PrelearningResultComponent} from './lesson/prelearning-results.component';
import {LessonOverviewTabComponent} from './lesson/lesson-overview-tab.component';

export function matchSubjectNodeUrl(segments: UrlSegment[]): UrlMatchResult {
  if (segments.length >= 2) {
    if (['unit', 'node', 'block', 'lesson'].includes(segments[0].path)) {
      return {
        consumed: segments.slice(0, 2),
        posParams: {
          node_id: segments[1]
        }
      };
    }
  }
  return null;
}

export function subjectNodeRoute(options: {type: SubjectNodeType, children?: Routes}) {
  return {
    path: options.type,
    component: SubjectNodeHostComponent,
    resolve: {
      node: SubjectNodeResolver
    },
    children: options.children
  }
}

export const routes: Routes = [
  {
    path: '',
    resolve: {
      node: SubjectNodeResolver
    },
  },
  subjectNodeRoute({type: 'unit'}),
  subjectNodeRoute({type: 'block'}),
  subjectNodeRoute({
    type: 'lesson',
    children: [
      { path: '', component: LessonOverviewTabComponent },
      { path: 'prelearning', component: PrelearningResultComponent },
      { path: 'outcomes'}
    ]
  }),
  {
    matcher: matchSubjectNodeUrl,
    component: SubjectNodeHostComponent,
    resolve: {
      node: SubjectNodeResolver
    }
  },
  {
    path: ''
  }
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
    SubjectNodeHostComponent,
    SubjectOverviewComponent,
  ],
  providers: [
    SubjectState,
    SubjectNodeResolver
  ]
})
export class SubjectsFeatureModule {}
