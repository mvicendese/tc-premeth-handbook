import {Component, OnDestroy, OnInit} from '@angular/core';
import {AppStateService} from './app-state.service';
import {SubjectsModelApiService} from './common/model-services/subjects-model-api.service';
import {Subscription, Unsubscribable} from 'rxjs';
import {StudentModelApiService} from './common/model-services/schools.service';
import {StudentContextService} from './features/schools/students/student-context.service';
import {TeacherLoader} from './features/schools/teachers/teacher-context.service';
import {StudentLoader} from './features/schools/students/student-loader.service';
import {UserModelLoader} from './features/base/auth/user.model-loader.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  private resources: Unsubscribable[] = [];
  title = 'matt-project';

  constructor(
    readonly appState: AppStateService,
    readonly subjectService: SubjectsModelApiService,
    readonly userLoader: UserModelLoader,
    readonly studentLoader: StudentLoader,
    readonly teacherLoader: TeacherLoader
  ) {
  }

  ngOnInit() {
    // For the moment, there is only one subject. Subject selection is useless.
    this.resources.push(
      this.subjectService.getSubject( 'PreMeth').subscribe(
        (subject) => this.appState.setState('subject', subject)
      )
    );

    this.resources.push(
      this.appState.init()
    );

    // TODO: Push these into AppState?
    this.resources.push(this.userLoader.init());
    this.resources.push(this.teacherLoader.init());
    this.resources.push(this.studentLoader.init());
  }

  ngOnDestroy() {
    this.resources.forEach(r => r.unsubscribe());
  }

}
