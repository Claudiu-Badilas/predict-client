import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { tap } from 'rxjs/operators';
import * as ToastActions from 'src/app/core/toast-notifications/actions/toast-notification.actions';
import { ToastStore } from 'src/app/core/toast-notifications/toast.store';
import * as LayoutActions from '../actions/layout.actions';
import { LayoutStore } from '../reducers/layout.reducer';

@Injectable()
export class SignalStateEffects {
  private readonly actions$ = inject(Actions);
  private readonly layoutStore = inject(LayoutStore);
  private readonly toastStore = inject(ToastStore);

  layout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(LayoutActions.spinnerOn, LayoutActions.spinnerOff),
        tap((action) =>
          'minimumVisibleMs' in action
            ? this.layoutStore.spinnerOn(action.minimumVisibleMs)
            : this.layoutStore.spinnerOff(),
        ),
      ),
    { dispatch: false },
  );

  toast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          ToastActions.showToast,
          ToastActions.showMultipleToasts,
          ToastActions.dismissToast,
        ),
        tap((action) => {
          if ('id' in action) this.toastStore.dismiss(action.id);
          else if ('toasts' in action) this.toastStore.showMany(action.toasts);
          else this.toastStore.show(action.message, action.toastType);
        }),
      ),
    { dispatch: false },
  );
}
