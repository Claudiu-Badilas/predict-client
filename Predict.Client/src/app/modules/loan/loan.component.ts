import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import * as LoanActions from 'src/app/modules/loan/actions/loan.actions';
import { AppState } from 'src/app/store/app-state.reducer';
import * as NavigationAction from 'src/app/store/actions/navigation.actions';

@Component({
  selector: 'p-loan',
  imports: [CommonModule, RouterModule],
  templateUrl: './loan.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./loan.component.scss'],
})
export class LoanComponent {
  constructor(private readonly store: Store<AppState>) {
    this.store.dispatch(LoanActions.loadRepaymentSchedules());
  }

  onSelectionChange(module: string) {
    this.store.dispatch(
      NavigationAction.navigateTo({
        route: `/loan/${module.toLowerCase()}`,
      }),
    );
  }
}
