import { createAction } from '@ngrx/store';

export const loadRepaymentSchedules = createAction(
  '[Loan] Load Repayment Schedules',
);

export const repaymentSchedulesLoaded = createAction(
  '[Loan] Repayment Schedules Loaded',
);
