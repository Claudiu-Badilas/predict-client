import {
  enableProdMode,
  importProvidersFrom,
  provideZonelessChangeDetection,
} from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

import { EffectsModule } from '@ngrx/effects';
import { StoreRouterConnectingModule } from '@ngrx/router-store';
import { StoreModule } from '@ngrx/store';
import { AuthenticationEffects } from 'src/app/core/authentication/effects/authentication.effects';
import * as fromAppStore from 'src/app/store/app-state.reducer';
import { NavigationEffects } from 'src/app/store/effects/navigation.effects';
import { SignalStateEffects } from 'src/app/store/effects/signal-state.effects';
import { AppComponent } from './app/app.component';
import { AppRouting } from './app/app.routing';
import { environment } from './environments/environment';

// Feature states & effects
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthenticationInterceptor } from 'src/app/core/authentication/interceptor/authentication.interceptor';
import { LoanEffects } from 'src/app/modules/loan/effects/loan.effects';
import { ReceiptsEffects } from 'src/app/modules/receipts/effects/receipts.effects';
import { TransactionsEffects } from 'src/app/modules/transaction/effects/transactions.effects';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    importProvidersFrom(AppRouting),
    importProvidersFrom(StoreModule.forRoot(fromAppStore.appReducer)),
    importProvidersFrom(
      EffectsModule.forRoot([
        NavigationEffects,
        AuthenticationEffects,
        SignalStateEffects,
      ]),
    ),
    importProvidersFrom(StoreRouterConnectingModule.forRoot()),
    importProvidersFrom(NgbModule),
    // Feature stores
    importProvidersFrom(
      EffectsModule.forFeature([
        ReceiptsEffects,
        TransactionsEffects,
        LoanEffects,
      ]),
    ),

    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthenticationInterceptor,
      multi: true,
    },
  ],
}).catch((err) => console.error(err));
