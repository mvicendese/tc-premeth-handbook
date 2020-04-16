import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {RouterModule, Routes, UrlMatchResult, UrlSegment} from '@angular/router';
import {MatTabsModule} from '@angular/material/tabs';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatDividerModule} from '@angular/material/divider';
import {ClassSharedModule} from '../classes/shared/class-shared.module';
import {SubjectOverviewComponent} from './subject-overview.component';
import {SubjectNodeHostComponent} from './subject-node-host.component';
import {SubjectNodeResolver} from './subject-node-resolver';
import {SubjectState} from './subject-state';
import {UnitsModule} from './units/units.module';
import {BlocksModule} from './blocks/blocks.module';
import {LessonModule} from './lesson/lesson.module';
import {LessonOutcomeModule} from './lesson-outcome/lesson-outcome.module';

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

export const routes: Routes = [
  {
    path: '',
    resolve: {
      node: SubjectNodeResolver
    },
  },
  {
    matcher: matchSubjectNodeUrl,
    component: SubjectNodeHostComponent,
    resolve: {
      node: SubjectNodeResolver
    }
  },
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
