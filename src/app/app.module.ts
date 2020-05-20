import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import {RouterModule} from '@angular/router';
import {appRoutes} from './app.routes';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {environment} from '../environments/environment';
import {HttpClientModule} from '@angular/common/http';
import {modelBaseProviders} from './common/model-api-context/base-providers';
import {ScaffoldModule} from './scaffold/scaffold.module';
import {AppStateService} from './app-state.service';
import {studentContextProviders} from './features/schools/students/student-context.service';
import {BaseAuthModule} from './features/base/auth/auth.module';
import {provideUserModelLoader} from './features/base/auth/user.model-loader.service';
import {provideStudentLoader} from './features/schools/students/student-loader.service';
import {provideTeacherLoader} from './features/schools/teachers/teacher-context.service';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(appRoutes),
    BrowserAnimationsModule,
    HttpClientModule,

    BaseAuthModule.forRoot(environment.base.auth),
    ScaffoldModule
  ],
  providers: [
    ...modelBaseProviders(environment.apiBaseHref),
    AppStateService,
    provideUserModelLoader(),
    provideStudentLoader(),
    studentContextProviders(),
    provideTeacherLoader()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
