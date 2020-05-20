import {Inject, Injectable, InjectionToken} from '@angular/core';
import {UserModelLoader} from './user.model-loader.service';
import {BehaviorSubject, defer, Observable, of} from 'rxjs';
import {filter, first, map, mapTo, switchMap, switchMapTo, tap} from 'rxjs/operators';
import {Ref, ref} from '../../../common/model-base/ref';
import {User} from './user.model';
import {ActivatedRouteSnapshot, CanActivate, ParamMap, Resolve, Router, UrlTree} from '@angular/router';
import {ApiAuthenticationBackend, ApiBackend} from '../../../common/model-api/api-backend';
import json, {Decoder} from '../../../common/json';
import {LocalStorageService, StoredValue} from '../../../common/local-storage.service';
import {UserModelApiService} from './user-model-api.service';
import {HttpHeaders, HttpParams} from '@angular/common/http';
import {DOCUMENT} from '@angular/common';

export interface ClientApplication {
  readonly clientId: string;
  readonly clientSecret: string;
}

export const BASE_AUTH_CLIENT_APP = new InjectionToken<ClientApplication>('BASE_AUTH_CLIENT_APP');

interface AccessToken {
  readonly accessToken: string;
  readonly tokenType: string;
  readonly expiresIn: number | null;
  readonly refreshToken: string | null;
  readonly scope: string | null;
}

function accessTokenFromJson(obj: unknown): AccessToken {
  return json.object({
    accessToken: json.string,
    tokenType: json.string as Decoder<'bearer'>,
    expiresIn: json.nullable(json.number),
    refreshToken: json.nullable(json.string),
    scope: json.nullable(json.string)
  }, obj);
}

function generateStateToken(): string {
  return Array.from(new Array(6)).map(() => {
    const randomIndex = Math.floor(Math.random() * LETTERS.length);
    return LETTERS[randomIndex];
  }).join('');
}

const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

interface LoginState {
  accessToken: string | null;
  refreshToken: string | null;
}

function loginStateFromJson(obj: unknown) {
  return json.object({
    stateToken: json.nullable(json.string),
    accessToken: json.nullable(json.string),
    refreshToken: json.nullable(json.string)
  }, obj)
}

@Injectable()
export class LoginService implements ApiAuthenticationBackend {
  protected stateToken = this.storage.storedValue<string | null>('base.auth.stateToken');
  protected restoreRoute = this.storage.storedValue<UrlTree>(
    'base.auth.restoreRoute',
    (urlTree) => this.router.parseUrl(json.string(urlTree || '/')),
    (urlTree: UrlTree | null) => urlTree ? this.router.serializeUrl(urlTree) : '/'
  );
  protected accessToken = this.storage.storedValue<string | null>('base.auth.accessToken');
  protected refreshToken = this.storage.storedValue<string | null>('base.auth.refreshToken');

  readonly isLoggedIn$ = defer(() =>
    this.accessToken.pipe(map(accessToken => accessToken != null))
  );

  readonly restoreRoute$ = defer(() => this.restoreRoute);

  constructor(
    @Inject(DOCUMENT)
    readonly document: Document,
    readonly router: Router,
    readonly storage: LocalStorageService,
    readonly apiBackend: ApiBackend,
    @Inject(BASE_AUTH_CLIENT_APP)
    readonly clientApp: ClientApplication
  ) {
  }

  beginAuthorizationFlow() {
    this.stateToken.next(generateStateToken());
    const view = document.defaultView;
    if (view == null) {
      throw new Error('not a browser environment');
    }
    view.location.href = this.authorizeUrl();
  }

  resumeAuthorizationFlow({authorizationCode, stateToken}: {authorizationCode: string, stateToken: string}): Observable<UrlTree> {
    return this.getAccessToken(authorizationCode).pipe(
      tap(accessToken => {
        if (stateToken !== this.stateToken.value) {
          // TODO: Probably shouldn't throw here.
          throw new Error('Invalid state token');
        }
        this.stateToken.next(null);
        this.accessToken.next(accessToken.accessToken);
        this.refreshToken.next(accessToken.refreshToken);
      }),
      switchMap(() => this.restoreRoute.pipe(first()))
    );
  }

  protected getAccessToken(authorizationCode: string): Observable<AccessToken> {
    const body = new HttpParams({
      fromObject: {
        grant_type: 'authorization_code',
        client_id: this.clientApp.clientId,
        client_secret: this.clientApp.clientSecret,
        redirect_uri: 'http://localhost:4200/oauth_callback',
        code: authorizationCode
      }
    });

    return this.apiBackend.post(['/auth', 'token'], body.toString(), {
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      }
    }).pipe(
      map(response => accessTokenFromJson(response)),
    );
  }

  protected authorizeUrl(): string {
    return this.apiBackend.apiUrl(['/auth/authorize'], {
      response_type: 'code',
      client_id: this.clientApp.clientId,
      state: this.stateToken.value!,
      scope: 'read write',
      /* FIXME */
      redirect_uri: 'http://localhost:4200/oauth_callback',
    })
  }

  authorizeHeaders(headers: HttpHeaders) {
    return headers.set('authorization', `bearer ${this.accessToken.value}`);
  }
}
