import { TestBed } from '@angular/core/testing';
import { LayoutStore } from 'src/app/store/layout.store';
import { describe, expect, it, vi } from 'vitest';
import { SpinnerComponent } from './spinner.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('SpinnerComponent', () => {
  it('should create', () => {
    expectComponentCreation(SpinnerComponent);
  });

  it('keeps loading visible for its minimum duration and hides it afterward', () => {
    expectComponentCreation(SpinnerComponent, (fixture) => {
      vi.useFakeTimers();
      try {
        const store = TestBed.inject(LayoutStore) as unknown as {
          loading: { set(value: boolean): void };
          minimumVisibleMs: { set(value: number): void };
        };
        store.minimumVisibleMs.set(1000);
        store.loading.set(true);
        fixture.detectChanges();
        expect(fixture.componentInstance.isVisible()).toBe(true);

        vi.advanceTimersByTime(300);
        store.loading.set(false);
        fixture.detectChanges();
        expect(fixture.componentInstance.isVisible()).toBe(true);

        store.loading.set(true);
        fixture.detectChanges();
        expect(fixture.componentInstance.isVisible()).toBe(true);
        store.loading.set(false);
        fixture.detectChanges();
        vi.advanceTimersByTime(1000);
        expect(fixture.componentInstance.isVisible()).toBe(false);

        store.loading.set(true);
        fixture.detectChanges();
        vi.advanceTimersByTime(1001);
        store.minimumVisibleMs.set(0);
        store.loading.set(false);
        fixture.detectChanges();
        expect(fixture.componentInstance.isVisible()).toBe(false);

        store.minimumVisibleMs.set(1000);
        store.loading.set(true);
        fixture.detectChanges();
        store.loading.set(false);
        fixture.detectChanges();
        expect(fixture.componentInstance.isVisible()).toBe(true);
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
