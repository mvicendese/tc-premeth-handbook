import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {Student} from '../../../common/model-types/schools';

@Component({
  selector: 'schools-student-info',
  template: `
    <div class="avatar"
         [ngStyle]="{ 'background-image': 'url(' + avatarHref + ')' }">
    </div>
    <div class="info">
      <div class="first-line">
        <h1>{{student.fullName}}</h1>
        <div class="separator"></div>
        <a mat-raised-button [href]="student.compassLink">
          <mat-icon>open_in_new</mat-icon> Open in compass
        </a>
      </div>
      <div class="subline">
        <h2><em>{{student.studentCode}}</em></h2>
        <span class="info">year level: {{student.yearLevel}} ({{student.group}})</span>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
    }
    .avatar {
      flex-basis: 90px;
      flex-shrink: 0;

      background-color: navajowhite;
      background-size: contain;
      background-repeat: no-repeat;
    }
    .info {
      flex-grow: 1;

      padding-left: 0.5rem;
    }

    .first-line {
      display: flex;
      width: 70%;
      align-items: baseline;
    }

    .separator {
      flex-grow: 1;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StudentInfoComponent {
  static readonly defaultAvatarHref = '/assets/images/avatar-male.png';

  @Input() student: Student;

  get avatarHref() {
    return this.student.avatarHref || StudentInfoComponent.defaultAvatarHref;
  }
}
