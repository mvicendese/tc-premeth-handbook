import {Injectable, Provider} from '@angular/core';
import {_ModelLoader, ModelLoader} from '../../../common/model-api-context/model-loader';
import {User} from './user.model';
import {UserModelApiService} from './user-model-api.service';
import {providePersonTypeLoader} from '../person/person-loader.service';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {filter, tap} from 'rxjs/operators';
import {Ref} from '../../../common/model-base/ref';
import {Resolve} from '@angular/router';


@Injectable()
export class UserModelLoader extends _ModelLoader<User> implements Resolve<User> {
  protected readonly selfSubject = new BehaviorSubject<User | null>(null);

  readonly type = 'user';

  constructor(
    readonly apiService: UserModelApiService
  ) {
    super(apiService);
  }

  init() {
    const modelLoaderSubscription = super.init();
    return {
      unsubscribe: () => {
        this.selfSubject.complete();
        modelLoaderSubscription.unsubscribe();
      }
    }
  }

  loadSelf() {
    return this.apiService.self().pipe(
      tap(loginUser => loginUser && this.loadWith(loginUser))
    );
  }

  resolve(): Observable<User> {
    return this.loadSelf().pipe(
      filter((self): self is User => self != null),
    );
  }
}

export function provideUserModelLoader(): Provider[] {
  return [
    UserModelLoader
  ];
}
