import {Component, OnDestroy, OnInit} from '@angular/core';
import {AppStateService} from './app-state.service';
import {SubjectService} from './common/model-services/subject.service';
import {Subscription} from 'rxjs';
import {StudentService} from './common/model-services/students.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  viewProviders: [
    {provide: AppStateService, useClass: AppStateService}
  ]
})
export class AppComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  title = 'matt-project';

  constructor(
    readonly appState: AppStateService,
    readonly subjectService: SubjectService
  ) {
  }

  ngOnInit() {
    // For the moment, there is only one subject. Subject selection is useless.
    this.subscriptions.push(
      this.subjectService.queryUnique('', {params: {name: 'PreMeth'}}).subscribe(
        (subject) => this.appState.setState('subject', subject)
      )
    );

    this.subscriptions.push(
      this.appState.watchClasses()
    );

  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

}
