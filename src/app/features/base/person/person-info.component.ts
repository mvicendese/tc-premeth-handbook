import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {Person} from './person.model';

@Component({
  selector: 'base-person-info',
  template: `
    <ng-container *ngIf="person">
      <img [basePersonAvatarFor]="person" size="small"/>
      <div class="info">
        <div class="first-line">
          <h1><a mat-flat-button [routerLink]="link">{{person.fullName}}</a></h1>
        </div>
      </div>
    </ng-container>
  `,
  styleUrls: [
    'person-info.component.scss'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PersonInfoComponent {

  @Input()
  person: Person | null;

  get link() {
    return this.person && ['/schools', this.person.type, this.person.id];
  }
}

