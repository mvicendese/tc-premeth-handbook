import {Injectable} from '@angular/core';
import {User} from '../../features/base/auth/user.model';
import {AbstractModelApiService} from '../model-api/abstract-model-api-service';
import {ApiBackend} from '../model-api/api-backend';


@Injectable({providedIn: 'root'})
export class UsersService extends AbstractModelApiService<User> {
  fromJson<U extends User>(obj: unknown) {
    return User.fromJson(obj) as U;
  }

  constructor(readonly backend: ApiBackend) {
    super(backend, ['/auth']);
  }
}

