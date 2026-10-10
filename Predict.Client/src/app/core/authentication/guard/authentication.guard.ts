import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import * as fromAppStore from 'src/app/store/app-state.reducer';
import * as NavigationAction from 'src/app/store/actions/navigation.actions';
import { AuthenticationUtils } from '../utils/authentication.utils';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationGuard implements CanActivate {
  constructor(private store: Store<fromAppStore.AppState>) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean> | Promise<boolean> | boolean | UrlTree {
    if (AuthenticationUtils.isTokenValid()) {
      return true;
    } else {
      this.store.dispatch(
        NavigationAction.navigateTo({ route: '/authentication/login' }),
      );
      return false;
    }
  }
}
