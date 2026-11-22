import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccessDeniedComponent } from './core/access/access-denied.component';
import { accessGuard } from './core/access/access.guard';

const routes: Routes = [
  {
    path: 'access-denied',
    component: AccessDeniedComponent,
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadChildren: () =>
      import('./modules/home/home.routing').then((m) => m.homeRoutes),
  },
  {
    path: 'loan',
    canActivate: [accessGuard],
    loadChildren: () =>
      import('./modules/loan/loan.routing').then((m) => m.loanRoutes),
  },
  {
    path: 'transactions',
    canActivate: [accessGuard],
    loadChildren: () =>
      import('./modules/transaction/transaction.routing').then(
        (m) => m.transactionRoutes,
      ),
  },
  {
    path: 'receipts',
    canActivate: [accessGuard],
    loadChildren: () =>
      import('./modules/receipts/receipts.routing').then(
        (m) => m.receiptsRoutes,
      ),
  },
  {
    path: '**',
    redirectTo: 'loan/overview',
    pathMatch: 'full',
  },
];

export const AppRouting: ModuleWithProviders<RouterModule> =
  RouterModule.forRoot(routes, {
    useHash: true,
    onSameUrlNavigation: 'ignore',
  });
