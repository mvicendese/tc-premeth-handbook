import {User} from './user.model';
import {Inject, Injectable, InjectionToken} from '@angular/core';
import {ModelLoader} from '../../../common/model-api-context/model-loader';
import {BehaviorSubject} from 'rxjs';
import {AbstractModelApiService} from '../../../common/model-api/abstract-model-api-service';
import {ApiBackend} from '../../../common/model-api/api-backend';

export const BASE_AUTH_CSRF_TOKEN = new InjectionToken<string>('BASE_AUTH_CSRF_TOKEN');

@Injectable()
export class UserModelApiService extends AbstractModelApiService<User> {
  fromJson<U extends User>(obj: unknown): U {
    return User.fromJson(obj) as U;
  }

  constructor(
    backend: ApiBackend,
    @Inject(BASE_AUTH_CSRF_TOKEN)
    readonly csrfToken: string
  ) {
    super(backend, ['/auth', 'users']);
  }
}

