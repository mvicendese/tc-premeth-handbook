import {Injectable, Provider} from '@angular/core';
import {_ModelLoader, ModelLoader} from '../../../common/model-api-context/model-loader';
import {User} from './user.model';
import {UserModelApiService} from './user-model-api.service';
import {providePersonTypeLoader} from '../person/person-loader.service';


@Injectable()
export class UserModelLoader extends _ModelLoader<User> {
  readonly type = 'user';

  constructor(
    readonly apiService: UserModelApiService
  ) {
    super(apiService);
  }
}

export function provideUserModelLoader(): Provider[] {
  return [
    UserModelLoader
  ];
}
