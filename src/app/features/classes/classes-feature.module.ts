import {InjectionToken, NgModule} from '@angular/core';
import {SubjectClass} from '../../common/model-types/subject-class';
import {Resolve, RouterModule, Routes} from '@angular/router';
import {modelServiceResolverFactory, provideModelResolver} from '../../common/model-base/model-resolver.service';
import {SubjectClassService} from '../../common/model-services/subject-class.service';
import {CommonModule} from '@angular/common';
import {SubjectClassPageComponent} from './subject-class-page.component';
import {MatCardModule} from '@angular/material/card';
import {MatTableModule} from '@angular/material/table';
import {StudentsSharedModule} from '../students/shared/students-shared.module';
import {UnitsSharedModule} from '../units/shared/units-shared.module';


export const RESOLVE_SUBJECT_CLASS = new InjectionToken<Resolve<SubjectClass>>('RESOLVE_SUBJECT_CLASS');

export const routes: Routes = [
  {
    path: ':class_id',
    resolve: {
      subjectClass: RESOLVE_SUBJECT_CLASS
    },
    component: SubjectClassPageComponent
  }
];

@NgModule({

  imports: [
    CommonModule,
    RouterModule.forChild(routes),

    MatCardModule,
    MatTableModule,

    StudentsSharedModule,
    UnitsSharedModule
  ],
  providers: [
    {
      provide: RESOLVE_SUBJECT_CLASS,
      useFactory: modelServiceResolverFactory({idParam: 'class_id'}),
      deps: [SubjectClassService]
    }
  ],
  declarations: [
    SubjectClassPageComponent
  ]
})
export class ClassesFeatureModule {}
