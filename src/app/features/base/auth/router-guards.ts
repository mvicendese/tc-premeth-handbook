/**
 * Most basic guard
 */
import {Injectable} from '@angular/core';
import {LoginService} from './login.service';
import {ActivatedRouteSnapshot, CanActivate, Router, UrlTree} from '@angular/router';
import {Observable, throwError} from 'rxjs';
import {first, switchMap} from 'rxjs/operators';

@Injectable({providedIn: 'root'})
export class IsAuthenticated implements CanActivate {

  constructor(
    readonly loginService: LoginService,
    readonly router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    return this.loginService.isLoggedIn$.pipe(
      first(),
      switchMap(async (isAuthenticated: boolean) => {
        if (!isAuthenticated) {
          this.loginService.beginAuthorizationFlow();
        }
        return isAuthenticated;
      })
    )
  }

}

@Injectable({providedIn: 'root'})
export class OauthCallback implements CanActivate {
  constructor(
    readonly loginService: LoginService,
    readonly router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<UrlTree> {
    const authorizationCode = route.queryParamMap.get('code');
    const stateToken = route.queryParamMap.get('state');

    if (authorizationCode == null) {
      return throwError('No authorization code param');
    }
    if (stateToken == null) {
      return throwError('No state param');
    }

    return this.loginService.resumeAuthorizationFlow({
      authorizationCode,
      stateToken
    })
  }
}
