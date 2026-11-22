import { Overlay } from '@angular/cdk/overlay';
import { signal } from '@angular/core';
import type { Provider, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { of, Subject } from 'rxjs';
import { expect, vi } from 'vitest';
import { AuthenticationStore } from '../core/authentication/authentication.store';
import { DeploymentUpdateService } from '../core/services/deployment-update.service';
import { ThemeService } from '../core/services/theme.service';
import { ToastStore } from '../core/toast-notifications/toast.store';
import { SimulationCombinationsStore } from '../modules/loan/components/simulation-combinations/simulation-combinations.store';
import { LoanStore } from '../modules/loan/stores/loan.store';
import { ReceiptsStore } from '../modules/receipts/stores/receipts.store';
import { TransactionsStore } from '../modules/transaction/stores/transactions.store';
import { DatePickerService } from '../shared/components/date-picker/services/date-picker.service';
import { StorageSettingsService } from '../shared/services/storage-settings.service';
import { LayoutStore } from '../store/layout.store';

export function expectComponentCreation<T>(component: Type<T>): void {
  TestBed.configureTestingModule({
    imports: [component],
    providers: createProviders(),
  });
  TestBed.overrideComponent(component, {
    set: { template: '', imports: [], styles: [] },
  });

  const fixture = TestBed.createComponent(component);
  expect(fixture.componentInstance).toBeTruthy();
  fixture.destroy();
  TestBed.resetTestingModule();
}

function createProviders(): Provider[] {
  const routeParams = convertToParamMap({});
  const router = {
    events: new Subject<unknown>(),
    url: '/',
    routerState: {
      snapshot: { root: { paramMap: routeParams, children: [] as never[] } },
    },
    navigate: vi.fn().mockResolvedValue(true),
    navigateByUrl: vi.fn().mockResolvedValue(true),
  };

  const themeService = {
    theme: signal<'light' | 'dim' | 'dark'>('light'),
    themeLabel: signal('Light'),
    iconTheme: signal<'light' | 'dark'>('light'),
    getCurrentTheme: vi.fn(() => 'light' as const),
    setTheme: vi.fn(),
    toggleTheme: vi.fn(),
  };
  const loanStore = {
    repaymentSchedules: signal([]),
    detailedSelectedName: signal(''),
    calculateRepaymentSchedules: signal(false),
    selectedOverviewSchedule: signal(null),
    includeDetailedSimulation: signal(false),
    historicalCompareInstalments: signal([]),
    detailedCompareToSchedule: signal(null),
    historicalInstalments: signal([]),
    historicalInstalmentPaymentBatches: signal([]),
    simulationMonthlyInstalmentBatches: signal([]),
    baseRepaymentSchedule: signal(null),
    detailedSelectedSchedule: signal(null),
    loadRepaymentSchedules: vi.fn(),
    setCalculateRepaymentSchedules: vi.fn(),
    setIncludeDetailedSimulation: vi.fn(),
    selectDetailedLoan: vi.fn(),
    resetSimulationPaymentOverrides: vi.fn(),
  };
  const receiptsStore = {
    startDate: signal(new Date('2019-01-01')),
    endDate: signal(new Date('2026-01-01')),
    receiptsView: {
      viewMode: signal<'all' | 'monthly' | 'yearly'>('all'),
      searchTerm: signal(''),
    },
    availableReceipts: signal([]),
    loadReceipts: vi.fn(),
    setReceiptsViewMode: vi.fn(),
    setDateRange: vi.fn(),
    setSearchTerm: vi.fn(),
  };
  const transactionsStore = {
    startDate: signal(new Date('2017-01-01')),
    endDate: signal(new Date('2026-01-01')),
    viewMode: signal<'all' | 'monthly' | 'yearly'>('monthly'),
    transactions: signal([]),
    economii: signal([]),
    loadTransactions: vi.fn(),
    setDateRange: vi.fn(),
    setViewMode: vi.fn(),
  };
  const toastStore = { toasts: signal([]), show: vi.fn(), dismiss: vi.fn() };
  const layoutStore = {
    loading: signal(false),
    minimumVisibleMs: signal(0),
    beginOperation: vi.fn(),
    endOperation: vi.fn(),
  };

  return [
    { provide: Router, useValue: router },
    {
      provide: ActivatedRoute,
      useValue: {
        queryParamMap: of(routeParams),
        snapshot: { queryParamMap: routeParams },
      },
    },
    { provide: ThemeService, useValue: themeService },
    { provide: AuthenticationStore, useValue: {} },
    { provide: ToastStore, useValue: toastStore },
    { provide: LayoutStore, useValue: layoutStore },
    { provide: LoanStore, useValue: loanStore },
    {
      provide: SimulationCombinationsStore,
      useValue: { rows: signal([]), setRows: vi.fn() },
    },
    { provide: ReceiptsStore, useValue: receiptsStore },
    { provide: TransactionsStore, useValue: transactionsStore },
    {
      provide: DatePickerService,
      useValue: {
        registerDatepicker: vi.fn(),
        unregisterDatepicker: vi.fn(),
      },
    },
    { provide: DeploymentUpdateService, useValue: {} },
    {
      provide: StorageSettingsService,
      useValue: {
        uploadStorageItemFromJson: vi.fn(),
        downloadStorageItem: vi.fn(),
        removeStorageItem: vi.fn(),
      },
    },
    { provide: NgbModal, useValue: { open: vi.fn() } },
    { provide: Overlay, useValue: {} },
  ];
}
