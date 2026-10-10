import { Injectable } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import {
  Router,
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
} from '@angular/router';
import { filter, tap } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import * as NavigationActions from '../actions/navigation.actions';
import * as LayoutActions from '../actions/layout.actions';
import { AppState } from '../app-state.reducer';

@Injectable()
export class NavigationEffects {
  constructor(
    private actions$: Actions,
    private router: Router,
    private store: Store<AppState>,
  ) {}

  navigateTo$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(NavigationActions.navigateTo),
        tap((action) => this.router.navigate([action.route])),
      ),
    { dispatch: false },
  );

  routerLoading$ = createEffect(
    () =>
      this.router.events.pipe(
        filter(
          (event) =>
            event instanceof NavigationStart ||
            event instanceof NavigationEnd ||
            event instanceof NavigationCancel ||
            event instanceof NavigationError,
        ),
        tap((event) => {
          if (event instanceof NavigationStart) {
            this.store.dispatch(LayoutActions.spinnerOn(500));
          } else {
            this.store.dispatch(LayoutActions.spinnerOff());
          }
        }),
      ),
    { dispatch: false },
  );
}
