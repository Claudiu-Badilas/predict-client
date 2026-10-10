import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TopBarComponent } from '../../shared/components/top-bar/top-bar.component';

@Component({
  selector: 'p-home',
  imports: [RouterModule, TopBarComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class HomeComponent {
  readonly modules = [
    {
      title: 'Loan simulator',
      description:
        'Choose a repayment schedule, adjust payment amounts and number of payments, then compare multiple combinations against the monthly instalment plan.',
      route: '/loan/overview',
      category: 'Plan',
      action: 'Explore simulator',
    },
    {
      title: 'Detailed loan',
      description:
        'Select a repayment schedule and inspect its detailed instalment view, loan insights, and repayment calculations.',
      route: '/loan/detailed',
      category: 'Understand',
      action: 'View loan details',
    },
    {
      title: 'Transactions',
      description:
        'Review common transactions and insights, switch between Transactions and Economii, and explore monthly, yearly, or custom date ranges.',
      route: '/transactions',
      category: 'Track',
      action: 'Explore transactions',
    },
    {
      title: 'Receipts',
      description:
        'Search products across receipts, choose a date range, switch between monthly, yearly, and all-time views, and sort by date or amount.',
      route: '/receipts',
      category: 'Review',
      action: 'Explore receipts',
    },
  ];

  readonly explorationPrompts = [
    {
      question: 'What changes when the monthly payment changes?',
      detail: 'Compare payment amounts and counts side by side.',
      route: '/loan/overview',
      action: 'Compare scenarios',
    },
    {
      question: 'What makes up a repayment schedule?',
      detail: 'Inspect the instalment breakdown and calculation controls.',
      route: '/loan/detailed',
      action: 'Inspect a schedule',
    },
    {
      question: 'How does spending vary over time?',
      detail:
        'Compare monthly or yearly activity across Transactions and Economii.',
      route: '/transactions',
      action: 'Review activity',
    },
    {
      question: 'Which products appear across my receipts?',
      detail: 'Search and sort products from your receipt history.',
      route: '/receipts',
      action: 'Browse products',
    },
  ];
}
