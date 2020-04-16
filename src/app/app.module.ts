import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import {RouterModule} from '@angular/router';
import {appRoutes} from './app.routes';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {environment} from '../environments/environment';
import {HttpClientModule} from '@angular/common/http';
import {modelBaseProviders} from './common/model-base/base-providers';
import {ScaffoldModule} from './scaffold/scaffold.module';
import {AppStateService} from './app-state.service';
import {StudentContextService} from './features/schools/students/student-context.service';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(appRoutes),
    BrowserAnimationsModule,
    HttpClientModule,

    ScaffoldModule
  ],
  providers: [
    ...modelBaseProviders(environment.apiBaseHref),
    AppStateService,
    StudentContextService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
