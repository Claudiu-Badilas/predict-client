import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import {
  catchError,
  debounceTime,
  filter,
  first,
  map,
  switchMap,
} from 'rxjs/operators';
import { select, Store } from '@ngrx/store';
import { AuthenticationService } from '../../../core/services/authentication.service';
import * as fromAppStore from 'src/app/store/app-state.reducer';
import * as NavigationAction from 'src/app/store/actions/navigation.actions';
import * as AuthActions from '../actions/authentication.actions';
import { AuthenticationUtils } from '../utils/authentication.utils';
import * as fromState from 'src/app/store/app-state.reducer';
import { EMPTY, of } from 'rxjs';
import * as ToastActions from '../../toast-notifications/actions/toast-notification.actions';
import { ToastType } from '../../toast-notifications/models/toast-type.model';

@Injectable()
export class AuthenticationEffects {
  constructor(
    private actions$: Actions,

    private _authService: AuthenticationService,
    private store: Store<fromAppStore.AppState>,
  ) {}

  checkToken$ = createEffect(() =>
    this.store.pipe(select(fromState.getRouterUrl)).pipe(
      debounceTime(500),
      filter((url) => url && url === '/'),
      map((_) => {
        const route = AuthenticationUtils.isTokenValid()
          ? '/loan/overview'
          : '/authentication/login';
        return NavigationAction.navigateTo({
          route,
        });
      }),
    ),
  );

  login$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.login),
        switchMap(({ email, password }) =>
          this._authService.login({ email, password }).pipe(
            first(),
            catchError((error) => {
              this.store.dispatch(
                ToastActions.showToast({
                  message: 'Something went wrong. Please try again.',
                  toastType: ToastType.Error,
                }),
              );
              return EMPTY;
            }),
          ),
        ),
        map(({ token }) => {
          if (AuthenticationUtils.isTokenValid(token)) {
            AuthenticationUtils.saveToken(token);
            return NavigationAction.navigateTo({ route: 'transactions' });
          }

          return NavigationAction.navigateTo({
            route: 'authentication/login',
          });
        }),
      ),
    { dispatch: false },
  );

  register$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.register),
        switchMap(({ email, password }) =>
          this._authService.register({ email, password }).pipe(
            first(),
            catchError((error) => {
              this.store.dispatch(
                ToastActions.showToast({
                  message: 'Something went wrong. Please try again.',
                  toastType: ToastType.Error,
                }),
              );
              return EMPTY;
            }),
          ),
        ),
      ),
    { dispatch: false },
  );

  logout$ = createEffect(
    () =>
      this.store.pipe(select(fromState.getRouterUrl)).pipe(
        debounceTime(500),
        filter((url) => url && url.includes('logout')),
        map(() => {
          AuthenticationUtils.logOut();
          return NavigationAction.navigateTo({
            route: '/authentication/login',
          });
        }),
      ),
    { dispatch: false },
  );
}
