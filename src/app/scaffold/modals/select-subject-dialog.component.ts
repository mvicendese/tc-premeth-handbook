import {Component} from '@angular/core';
import {AppStateService} from '../../app-state.service';
import {SubjectsService} from '../../common/model-services/subjects.service';
import {map, shareReplay} from 'rxjs/operators';
import {SubjectIndex} from '../../common/model-types/subjects';


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
    readonly subjectsService: SubjectsService,
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
