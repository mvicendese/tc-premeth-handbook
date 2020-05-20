import {User} from './user.model';
import {Inject, Injectable, InjectionToken} from '@angular/core';
import {ModelLoader} from '../../../common/model-api-context/model-loader';
import {BehaviorSubject, Observable, throwError} from 'rxjs';
import {AbstractModelApiService} from '../../../common/model-api/abstract-model-api-service';
import {ApiBackend} from '../../../common/model-api/api-backend';
import {Router} from '@angular/router';
import {HttpErrorResponse, HttpParams} from '@angular/common/http';
import {catchError, map} from 'rxjs/operators';

export const BASE_AUTH_CSRF_TOKEN = new InjectionToken<string>('BASE_AUTH_CSRF_TOKEN');

export interface ClientApplication {
  readonly clientId: string;
  readonly clientSecret: string;
}

export const BASE_AUTH_CLIENT_APP = new InjectionToken<ClientApplication>('BASE_AUTH_CLIENT_APP');

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
    super(backend, ['/users']);
  }

  self(): Observable<User | null> {
    return this.backend.get(['self']).pipe(
      map((response) => this.fromJson(response)),
      catchError((err) => {
        if (err instanceof HttpErrorResponse) {
          debugger;
        }
        return throwError(err);
      })
    );
  }
}
