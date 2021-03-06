import {Inject, Injectable, InjectionToken, Provider} from '@angular/core';
import {AnyReport} from '../../common/model-types/assessment-reports';
import {AssessmentsModelApiService} from '../../common/model-services/assessments.service';
import {AppStateService} from '../../app-state.service';
import {AssessmentType} from '../../common/model-types/assessments';
import {SubjectNodeRouteData} from './subject-node-route-data';
import {combineLatest, merge, Observable, Unsubscribable} from 'rxjs';
import {map, scan, shareReplay, switchMap} from 'rxjs/operators';
import {SubjectNode} from '../../common/model-types/subjects';
import {SubjectClass} from '../../common/model-types/schools';
import {Ref} from '../../common/model-base/ref';

export interface ReportLoaderOptions {
  readonly assessmentType: AssessmentType;
  readonly childAssessmentTypes: AssessmentType[];
}

export const REPORT_LOADER_OPTIONS = new InjectionToken<ReportLoaderOptions>('REPORT_LOADER_OPTIONS');

export function provideReportLoaderOptions(options: {assessmentType: AssessmentType; childAssessmentTypes: AssessmentType[]; }): Provider {
  return {
    provide: REPORT_LOADER_OPTIONS,
    useValue: options
  };
}


@Injectable()
export class AssessmentReportLoader<R extends AnyReport> {
  constructor(
    readonly assessments: AssessmentsModelApiService,
    readonly appStateService: AppStateService,

    @Inject(REPORT_LOADER_OPTIONS) readonly options: ReportLoaderOptions,

    readonly nodeContext: SubjectNodeRouteData
  ) {
  }

  get assessmentType() { return this.options.assessmentType as R['assessmentType']; }
  get childAssessmentTypes() { return this.options.childAssessmentTypes; }

  init(): Unsubscribable {
    const report = this.report$.subscribe();
    const childReports = this.childReports$.subscribe();
    return {
      unsubscribe: () => {
        report.unsubscribe();
        childReports.unsubscribe();
      }
    };
  }

  readonly report$ = combineLatest([
    this.nodeContext.subjectNode$,
    this.appStateService.activeSubjectClass$
  ]).pipe(
    switchMap(([node, subjectClass]) => this.loadReport(node, subjectClass)),
    shareReplay(1)
  );

  readonly childReports$: Observable<Record<AssessmentType, {[childNodeId: string]: AnyReport}>> = combineLatest([
    this.nodeContext.subjectNode$,
    this.appStateService.activeSubjectClass$
  ]).pipe(
    switchMap(([node, subjectClass]) => this.loadChildReports(node, subjectClass))
  );

  childReportsOfType<T extends AnyReport>(childAssessmentType: T['assessmentType']): Observable<{[subjectNodeId: string]: T }> {
    return this.childReports$.pipe(
      map(allReports => allReports[childAssessmentType] as {[subjectNodeId: string]: T}),
      map(report => report == null ? {} : report)
    );
  }

  protected loadReport(node: Ref<SubjectNode>, subjectClass: SubjectClass | null): Observable<R> {
    const params = {node, subjectClass};
    return this.assessments.fetchReport(this.assessmentType, { params });
  }

  /**
   * Load the reports for the direct children of the node.
   * @param node
   * @param subjectClass
   */
  protected loadChildReports(node: Ref<SubjectNode>, subjectClass: SubjectClass | null): Observable<Record<AssessmentType, {[childNodeId: string]: AnyReport}>> {

    function loadChildReports(childType: AssessmentType): Observable<[AssessmentType, {[childId: string]: AnyReport}]> {
      const params = {node, subjectClass};
      return (this as AssessmentReportLoader<R>).assessments.queryReports(childType, { params }).pipe(
        map(page => Object.fromEntries(page.results.map((report) => [report.subjectNode.id, report]))),
        map(reports => [childType, reports])
      );
    }

    return merge(...this.childAssessmentTypes.map(reportType => loadChildReports.call(this, reportType))).pipe(
      scan(
        (acc, [reportType, childReports]) => ({
          ...acc,
          [reportType]: Object.assign({}, acc[reportType], childReports)
        }),
        {} as Record<AssessmentType, {[childNodeId: string]: AnyReport}>
      )
    );
  }
}

