import { Routes } from '@angular/router';
import { LoanDetailedComponent } from './loan-detailed/loan-detailed.component';
import { LoanSimulatorComponent } from './loan-simulator/loan-simulator.component';
import { LoanComponent } from './loan.component';

export const loanRoutes: Routes = [
  {
    path: '',
    component: LoanComponent,
    children: [
      { path: 'overview', component: LoanSimulatorComponent },
      { path: 'detailed', component: LoanDetailedComponent },
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
    ],
  },
];
