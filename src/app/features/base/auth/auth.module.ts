import {CommonModule} from '@angular/common';
import {ModuleWithProviders, NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {UserModelLoader} from './user.model-loader-service';
import {BASE_AUTH_CSRF_TOKEN, UserModelApiService} from './user-model-api.service';
import {MatButtonModule} from '@angular/material/button';
import {ContextContainerComponent} from './auth-context-container.component';
import {PersonModule} from '../person/person.module';

interface AuthFeatureConfig {
  readonly token: string;
}

@NgModule({
  imports: [
    CommonModule,
    RouterModule,

    MatButtonModule,

    PersonModule
  ],
  declarations: [
    ContextContainerComponent
  ],
  exports: [
    ContextContainerComponent
  ]
})
export class BaseAuthModule {
  static forRoot(config: AuthFeatureConfig): ModuleWithProviders {
    return {
      ngModule: BaseAuthModule,
      providers: [
        {provide: BASE_AUTH_CSRF_TOKEN, useValue: config.token},
        UserModelApiService,
        UserModelLoader
      ]
    }
  }
}
