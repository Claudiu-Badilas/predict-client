import { DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import {
  EMPTY,
  catchError,
  debounceTime,
  filter,
  first,
  pipe,
  switchMap,
  tap,
} from 'rxjs';
import { signalStore, withHooks, withMethods } from '@ngrx/signals';
import { AuthenticationService } from '../services/authentication.service';
import { ToastStore } from '../toast-notifications/toast.store';
import { ToastType } from '../toast-notifications/models/toast-type.model';
import { AuthenticationUtils } from './utils/authentication.utils';

export interface AuthenticationCredentials {
  email: string;
  password: string;
}

const authenticationErrorMessage = 'Something went wrong. Please try again.';

export const AuthenticationStore = signalStore(
  { providedIn: 'root' },
  withMethods(
    (
      _store,
      authenticationService = inject(AuthenticationService),
      router = inject(Router),
      toastStore = inject(ToastStore),
    ) => {
      const loginRequest = rxMethod<AuthenticationCredentials>(
        pipe(
          switchMap((credentials) =>
            authenticationService.login(credentials).pipe(
              first(),
              tap(({ token }) => {
                if (AuthenticationUtils.isTokenValid(token)) {
                  AuthenticationUtils.saveToken(token);
                  void router.navigateByUrl('/transactions');
                } else {
                  void router.navigateByUrl('/authentication/login');
                }
              }),
              catchError(() => {
                toastStore.show(authenticationErrorMessage, ToastType.Error);
                return EMPTY;
              }),
            ),
          ),
        ),
      );

      const registerRequest = rxMethod<AuthenticationCredentials>(
        pipe(
          switchMap((credentials) =>
            authenticationService.register(credentials).pipe(
              first(),
              catchError(() => {
                toastStore.show(authenticationErrorMessage, ToastType.Error);
                return EMPTY;
              }),
            ),
          ),
        ),
      );

      const handleRoute = rxMethod<string>(
        pipe(
          debounceTime(500),
          tap((url) => {
            if (url === '/') {
              const target = AuthenticationUtils.isTokenValid()
                ? '/loan/overview'
                : '/authentication/login';
              void router.navigateByUrl(target);
            }

            if (url.includes('logout')) {
              AuthenticationUtils.logOut();
              void router.navigateByUrl('/authentication/login');
            }
          }),
        ),
      );

      return {
        login(credentials: AuthenticationCredentials): void {
          loginRequest(credentials);
        },
        register(credentials: AuthenticationCredentials): void {
          registerRequest(credentials);
        },
        handleRoute(url: string): void {
          handleRoute(url);
        },
      };
    },
  ),
  withHooks({
    onInit(store) {
      const router = inject(Router);
      const destroyRef = inject(DestroyRef);

      router.events
        .pipe(
          filter(
            (event): event is NavigationEnd => event instanceof NavigationEnd,
          ),
          takeUntilDestroyed(destroyRef),
        )
        .subscribe((event) => store.handleRoute(event.urlAfterRedirects));
      store.handleRoute(router.url);
    },
  }),
);
