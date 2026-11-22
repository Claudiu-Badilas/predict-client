import { Overlay } from '@angular/cdk/overlay';
import { FormControl } from '@angular/forms';
import { isSignal, reflectComponentType, signal } from '@angular/core';
import type { Provider, Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject, Subject } from 'rxjs';
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

export function expectComponentCreation<T>(
  component: Type<T>,
  exercise?: (fixture: ComponentFixture<T>) => void,
  providers: Provider[] = [],
): void {
  const fixture = createComponentFixture(component, providers);
  try {
    exercise?.(fixture);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  } finally {
    cleanupComponentFixture(fixture);
  }
}

export async function expectAsyncComponentCreation<T>(
  component: Type<T>,
  exercise: (fixture: ComponentFixture<T>) => Promise<void>,
): Promise<void> {
  const fixture = createComponentFixture(component, []);
  try {
    await exercise(fixture);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  } finally {
    cleanupComponentFixture(fixture);
  }
}

function createComponentFixture<T>(
  component: Type<T>,
  providers: Provider[],
): ComponentFixture<T> {
  const storage = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  });
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
      constructor(_callback: ResizeObserverCallback) {}
    },
  );
  TestBed.configureTestingModule({
    imports: [component],
    providers: [...createProviders(), ...providers],
  });
  const fixture = TestBed.createComponent(component);
  const componentMirror = reflectComponentType(component);
  componentMirror?.inputs.forEach(({ propName, templateName }) => {
    const inputValue = getInputValue(component.name, propName);
    if (inputValue !== undefined) {
      fixture.componentRef.setInput(templateName, inputValue);
    }
  });
  fixture.detectChanges();

  const viewQueries = new Set<string>();
  Object.entries(fixture.componentInstance as Record<string, unknown>).forEach(
    ([key, value]) => {
      if (isSignal(value) && !viewQueries.has(key)) value();
    },
  );
  return fixture;
}

function cleanupComponentFixture<T>(fixture: ComponentFixture<T>): void {
  fixture.destroy();
  TestBed.resetTestingModule();
  vi.unstubAllGlobals();
}

function getInputValue(componentName: string, propName: string): unknown {
  const date = new Date(2024, 0, 15);
  if (propName === 'config') {
    if (componentName.includes('ActivityCalendarComponent')) {
      return {
        colorOptions: [
          { id: 'default', label: 'Default', color: '#eeeeee' },
          { id: 'blue', label: 'Blue', color: '#3366ff', darkColor: '#6699ff' },
        ],
      };
    }
    if (componentName.includes('PlatformToggleComponent')) {
      return {
        type: 'tabs',
        options: ['All', 'Monthly', 'Yearly'],
        selected: 'All',
        ariaLabel: 'Select view',
      };
    }
    return {
      title: 'Storage',
      storageKey: 'test-storage',
      loadError: signal<string | null>(null),
    };
  }

  if (propName === 'control') return new FormControl<number | null>(null);
  if (propName === 'chartOptions') return null;
  if (propName === 'datepickerId') return 'test-datepicker';
  if (propName === 'items') return [];
  if (componentName.includes('DatePickerComponent')) return undefined;
  if (propName === 'fromDate' || propName === 'toDate') return date;
  if (propName.toLowerCase().includes('date')) return date;
  if (propName.toLowerCase().includes('group')) return [];
  if (
    propName === 'contributions' ||
    propName === 'transactions' ||
    propName === 'economiiTransactions' ||
    propName === 'receipts'
  )
    return [];
  if (propName === 'viewMode') return 'monthly';
  if (propName === 'sortMode') return 'newest';
  if (propName === 'searchTerm' || propName === 'selectedItemInput') return '';
  if (propName === 'showEconomii' || propName === 'dropUp') return false;
  if (propName === 'maxPayments') return undefined;
  return undefined;
}

function createProviders(): Provider[] {
  const routeParams = convertToParamMap({});
  const routeQueryParams = new BehaviorSubject(routeParams);
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
    monthlyInstalmentBatches: signal([]),
    overviewSelectedName: signal(''),
    detailedSelectedName: signal(''),
    calculateRepaymentSchedules: signal(false),
    selectedOverviewSchedule: signal(null),
    includeDetailedSimulation: signal(false),
    selectedEarlyPayments: signal([]),
    selectedInstalmentPayments: signal([]),
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
    selectOverviewLoan: vi.fn(),
    resetSimulationPaymentOverrides: vi.fn(),
    toggleEarlyPayments: vi.fn(),
    toggleInstalmentPayments: vi.fn(),
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
    error: signal<string | null>(null),
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
        queryParamMap: routeQueryParams,
        snapshot: { queryParamMap: routeParams },
      },
    },
    { provide: ThemeService, useValue: themeService },
    {
      provide: AuthenticationStore,
      useValue: { login: vi.fn(), register: vi.fn() },
    },
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
        openDatepicker: vi.fn(),
        closeDatepicker: vi.fn(),
      },
    },
    {
      provide: DeploymentUpdateService,
      useValue: {
        updateAvailable: signal(false),
        availableDeployment: signal(null),
      },
    },
    {
      provide: StorageSettingsService,
      useValue: {
        uploadStorageItemFromJson: vi.fn(),
        downloadStorageItem: vi.fn(),
        removeStorageItem: vi.fn(),
      },
    },
    { provide: NgbModal, useValue: { open: vi.fn() } },
    { provide: NgbActiveModal, useValue: { dismiss: vi.fn() } },
    { provide: Overlay, useValue: createOverlayMock() },
  ];
}

function createOverlayMock(): Overlay {
  const backdropClicks = new Subject<void>();
  const positionStrategy = {
    withPositions: vi.fn(() => positionStrategy),
    withFlexibleDimensions: vi.fn(() => positionStrategy),
    withPush: vi.fn(() => positionStrategy),
    top: vi.fn(() => positionStrategy),
    left: vi.fn(() => positionStrategy),
    width: vi.fn(() => positionStrategy),
    height: vi.fn(() => positionStrategy),
  };
  const overlayRef = {
    backdropClick: () => backdropClicks,
    attach: vi.fn(),
    detach: vi.fn(),
    dispose: vi.fn(),
    hasAttached: vi.fn(() => false),
    overlayElement: { style: {} },
  };

  return {
    position: () => ({
      flexibleConnectedTo: vi.fn(() => positionStrategy),
      global: vi.fn(() => positionStrategy),
    }),
    scrollStrategies: {
      reposition: vi.fn(() => ({})),
      block: vi.fn(() => ({})),
    },
    create: vi.fn(() => overlayRef),
  } as unknown as Overlay;
}
