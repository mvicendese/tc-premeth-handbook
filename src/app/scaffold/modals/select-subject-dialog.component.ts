import {Component} from '@angular/core';
import {AppStateService} from '../../app-state.service';
import {SubjectIndex} from '../../common/model-types/subject';
import {Observable} from 'rxjs';
import {ResponsePage} from '../../common/model-base/pagination';
import {SubjectService} from '../../common/model-services/subject.service';
import {map, publishReplay, shareReplay} from 'rxjs/operators';


@Component({
  selector: 'app-select-subject-dialog',
  template: `
    <ng-container *ngIf="(allSubjects$ | async) as allSubjects; else loading">
    <h1 mat-dialog-title>Select subject</h1>

    <div mat-dialog-content>
      <p>Select subject...</p>
      <app-subjects-selector
        [values]="allSubjects"
        [value]="appState.subject$ | async"
        (valueChange)="selectSubject($event)">
      </app-subjects-selector>
    </div>
    </ng-container>

    <ng-template #loading><app-loading></app-loading></ng-template>
  `
})
export class SelectSubjectDialogComponent {

  // Assume all subjects are returned in a single page.
  // The selector could support searching, but especially now when we only have one subject...
  readonly allSubjectsPage$ = this.subjectsService.index();
  readonly allSubjects$ = this.allSubjectsPage$.pipe(
    map(page => page.results),
    shareReplay(1)
  );

  constructor(
    readonly subjectsService: SubjectService,
    readonly appState: AppStateService
  ) {}

  selectSubject(value: SubjectIndex | null) {
    if (value == null) {
      this.appState.setState('subject', null);
    } else {
      this.subjectsService.fetch(value).subscribe(
        (subject) => this.appState.setState('subject', subject)
      );
    }
  }
}
