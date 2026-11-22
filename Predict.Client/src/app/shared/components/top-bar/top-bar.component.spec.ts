import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { ThemeService } from 'src/app/core/services/theme.service';
import { describe, expect, it, vi } from 'vitest';
import { TopBarComponent } from './top-bar.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('TopBarComponent', () => {
  it('should create', () => {
    expectComponentCreation(TopBarComponent);
  });

  it('tracks routes, mobile navigation, filter animations, and theme icons', () => {
    expectComponentCreation(TopBarComponent, (fixture) => {
      const component = fixture.componentInstance;
      const router = TestBed.inject(Router) as unknown as {
        events: { next(event: unknown): void };
        navigateByUrl: (url: string) => Promise<boolean>;
      };
      const navigate = vi.spyOn(router, 'navigateByUrl');
      const theme = TestBed.inject(ThemeService) as unknown as {
        iconTheme: { set(value: 'light' | 'dark'): void };
      };
      const requestFrame = vi.fn((callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      });
      vi.stubGlobal('requestAnimationFrame', requestFrame);

      expect(component.isActiveRoute('/')).toBe(true);
      expect(component.isActiveRoute('/receipts')).toBe(false);
      router.events.next(new NavigationEnd(1, '/', '/transactions/2024'));
      expect(component.currentUrl()).toBe('/transactions/2024');
      expect(component.isActiveRoute('/transactions')).toBe(true);
      expect(component.isActiveRoute('/')).toBe(false);
      expect(component.getThemeIconPath('filter')).toBe(
        'assets/icons/light/filter.svg',
      );
      theme.iconTheme.set('dark');
      expect(component.getThemeIconPath('filter')).toBe(
        'assets/icons/dark/filter.svg',
      );

      fixture.componentRef.setInput('hasModuleNavContent', true);
      fixture.componentRef.setInput('hasFiltersContent', true);
      fixture.detectChanges();
      component.toggleMobileControls();
      expect(component.isMobileControlsOpen()).toBe(true);
      expect(component.isMenuOpen()).toBe(true);
      expect(component.isFilterPanelOpen()).toBe(true);
      expect(component.isAnimating()).toBe(false);
      component.isAnimating.set(true);
      component.toggleMobileControls();
      expect(component.isMenuOpen()).toBe(true);
      component.isAnimating.set(false);
      component.toggleMobileControls();
      expect(component.isMobileControlsOpen()).toBe(false);

      component.isMenuOpen.set(true);
      component.isFilterPanelOpen.set(false);
      component.toggleFilterPanel();
      expect(component.isMenuOpen()).toBe(false);
      expect(component.isFilterPanelOpen()).toBe(true);
      component.toggleFilterPanel();
      expect(component.isFilterPanelOpen()).toBe(false);
      component.isAnimating.set(true);
      component.toggleFilterPanel();
      expect(component.isFilterPanelOpen()).toBe(false);
      component.isAnimating.set(false);

      component.onNavigateTo('/home');
      expect(navigate).toHaveBeenCalledWith('/home');
      component.closeMenu();
      expect(component.isMenuOpen()).toBe(false);
      expect(requestFrame).toHaveBeenCalled();
    });
  });
});
