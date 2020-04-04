import {Component, OnDestroy, OnInit} from '@angular/core';
import {AppStateService} from './app-state.service';
import {SubjectsService} from './common/model-services/subjects.service';
import {Subscription, Unsubscribable} from 'rxjs';
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
  private resources: Unsubscribable[] = [];
  title = 'matt-project';

  constructor(
    readonly appState: AppStateService,
    readonly subjectService: SubjectsService
  ) {
  }

  ngOnInit() {
    // For the moment, there is only one subject. Subject selection is useless.
    this.resources.push(
      this.subjectService.queryUnique('', {params: {name: 'PreMeth'}}).subscribe(
        (subject) => this.appState.setState('subject', subject)
      )
    );

    this.resources.push(
      this.appState.init()
    );

  }

  ngOnDestroy() {
    this.resources.forEach(r => r.unsubscribe());
  }

}
