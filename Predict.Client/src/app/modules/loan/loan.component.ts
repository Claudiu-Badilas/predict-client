import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LoanStore } from './stores/loan.store';

@Component({
  selector: 'p-loan',
  imports: [CommonModule, RouterModule],
  templateUrl: './loan.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./loan.component.scss'],
})
export class LoanComponent {
  private readonly loanStore = inject(LoanStore);
  constructor() {
    this.loanStore.loadRepaymentSchedules();
  }
}
