import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: '',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadChildren: () =>
      import('./modules/home/home.routing').then((m) => m.homeRoutes),
  },
  {
    path: 'loan',
    loadChildren: () =>
      import('./modules/loan/loan.routing').then((m) => m.loanRoutes),
  },
  {
    path: 'daily-goals',
    loadChildren: () =>
      import('./modules/daily-goals/daily-goals.routing').then(
        (m) => m.dailyGoalsRoutes,
      ),
  },
  {
    path: 'transactions',
    loadChildren: () =>
      import('./modules/transaction/transaction.routing').then(
        (m) => m.transactionRoutes,
      ),
  },
  {
    path: 'receipts',
    loadChildren: () =>
      import('./modules/receipts/receipts.routing').then(
        (m) => m.receiptsRoutes,
      ),
  },
  {
    path: 'authentication',
    loadChildren: () =>
      import('./core/authentication/authentication.routing').then(
        (m) => m.authenticationRoutes,
      ),
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];

export const AppRouting: ModuleWithProviders<RouterModule> =
  RouterModule.forRoot(routes, {
    useHash: true,
    onSameUrlNavigation: 'ignore',
  });
