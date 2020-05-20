import {CommonModule} from '@angular/common';
import {ModuleWithProviders, NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {UserModelLoader} from './user.model-loader.service';
import {BASE_AUTH_CSRF_TOKEN, UserModelApiService} from './user-model-api.service';
import {MatButtonModule} from '@angular/material/button';
import {ContextContainerComponent} from './auth-context-container.component';
import {PersonModule} from '../person/person.module';
import {BASE_AUTH_CLIENT_APP, ClientApplication, LoginService} from './login.service';
import {ApiAuthenticationBackend} from '../../../common/model-api/api-backend';

interface AuthFeatureConfig {
  readonly token: string;
  readonly app: ClientApplication;
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
        {provide: BASE_AUTH_CLIENT_APP, useValue: config.app},
        UserModelApiService,
        UserModelLoader,
        LoginService,
        {provide: ApiAuthenticationBackend, useClass: LoginService}
      ]
    }
  }
}
