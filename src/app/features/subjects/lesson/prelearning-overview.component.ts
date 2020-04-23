import {Component, Input} from '@angular/core';
import {LessonPrelearningReport} from '../../../common/model-types/assessment-reports';
import {LessonSchema} from '../../../common/model-types/subjects';

@Component({
  selector: 'subjects-prelearning-overview',
  template: `
    <div class="report-container" *ngIf="report">
      <dl>
        <dt>Students Complete</dt>
        <dd>
          {{report.completeCandidateCount}} / {{report.candidateCount}}
        <span class="percentage">{{report.percentCompleted}}</span>
        </dd>
      </dl>
      <!--
<form class="table-controls" [formGroup]="controlsForm">
  <mat-checkbox formControlName="hideComplete">Hide if prelearning complete</mat-checkbox>
</form>
-->
    </div>
  `
})
export class PrelearningOverviewComponent {
  @Input() lesson: LessonSchema;
  @Input() report: LessonPrelearningReport;
}
