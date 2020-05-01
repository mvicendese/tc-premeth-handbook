import {Injectable, Provider, StaticProvider, Type} from '@angular/core';
import {AssessmentType} from '../../common/model-types/assessments';
import {SubjectNodeRouteData} from './subject-node-route-data';
import {AssessmentResolveQueue, provideAssessmentResolveQueueOptions} from './assessment-resolve-queue';
import {AssessmentReportLoader, provideReportLoaderOptions} from './assessment-report-loader';


export function provideSubjectNodeState(options: {
  assessmentType: AssessmentType;
  childAssessmentTypes: AssessmentType[];
}): Provider[] {
  return [
    SubjectNodeRouteData,
    provideAssessmentResolveQueueOptions(options),
    AssessmentResolveQueue,
    provideReportLoaderOptions(options),
    AssessmentReportLoader,
  ];
}

