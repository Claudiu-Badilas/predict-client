import { createAction, props } from '@ngrx/store';
import { ReceiptDomain } from '../models/receipts-domain.model';

export const loadReceipts = createAction('[Receipts] Load Receipts');

export const setReceiptsSuccess = createAction(
  '[Receipts] Set Receipts Success',
  props<{ receipts: ReceiptDomain[] }>(),
);

export const loadReceiptsFailure = createAction(
  '[Receipts] Load Receipts Failure',
  props<{ message: string }>(),
);

export const dateRangeChanged = createAction(
  '[Receipts] Date Range Changed',
  props<{ startDate: Date; endDate: Date }>(),
);

export const searchTermChanged = createAction(
  '[Receipts] Search Term Changed',
  props<{ searchTerm: string }>(),
);

export const receiptsViewModeChanged = createAction(
  '[Receipts] View Mode Changed',
  props<{ viewMode: 'all' | 'monthly' | 'yearly' }>(),
);
