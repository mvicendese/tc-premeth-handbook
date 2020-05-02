import {Component, Input} from '@angular/core';
import {LessonPrelearningReport} from '../../../common/model-types/assessment-reports';
import {LessonSchema} from '../../../common/model-types/subjects';

@Component({
  selector: 'subjects-prelearning-overview',
  template: `
    <div class="report-container mat-elevation-z3" *ngIf="report">
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
  `,
  styles: [`
    :host {
      display: flex;
      justify-content: center;
    }
    .report-container {
       flex-basis: 80%;
       background-color: #fff;
       display: flex;
    }
    
    dt {
      display: inline;
      font: 500 12px "Roboto", sans-serif;
    }
    
  `]
})
export class PrelearningOverviewComponent {
  @Input() lesson: LessonSchema;
  @Input() report: LessonPrelearningReport;
}
