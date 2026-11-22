import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ThemeService } from 'src/app/core/services/theme.service';
import { PlatformToggleComponent } from './platform-toggle.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('PlatformToggleComponent', () => {
  it('should create', () => {
    expectComponentCreation(PlatformToggleComponent);
  });

  it('selects options and derives labels, icons, indexes, and gradients', () => {
    expectComponentCreation(PlatformToggleComponent, (fixture) => {
      const component = fixture.componentInstance;
      const theme = TestBed.inject(ThemeService) as unknown as {
        iconTheme: { set(value: 'light' | 'dark'): void };
      };
      const selected: string[] = [];
      component.selectionChange.subscribe((value) => selected.push(value));
      const iconOption = {
        label: 'Dashboard',
        value: 'home',
        iconPath: '/icons/home.svg',
      };

      component.select(iconOption);
      expect(component.getOptionLabel(iconOption)).toBe('Dashboard');
      expect(component.getOptionValue(iconOption)).toBe('home');
      expect(component.getOptionValue({ label: 'Fallback label' })).toBe(
        'Fallback label',
      );
      expect(component.getOptionIcon(iconOption)).toBe('/icons/light/home.svg');
      expect(component.getSelectedIndex(['All', iconOption])).toBe(1);
      expect(
        component.getGradient({
          type: 'tabs',
          options: [],
          selected: null,
          ariaLabel: 'views',
        }),
      ).toBe('linear-gradient(135deg, #c61a54, #d5a326)');
      expect(
        component.getGradient({
          type: 'tabs',
          options: [],
          selected: null,
          ariaLabel: 'views',
          gradient: { primaryColor: 'red', secondaryColor: 'blue' },
        }),
      ).toBe('linear-gradient(135deg, red, blue)');
      expect(selected).toEqual(['home']);
      theme.iconTheme.set('dark');
      expect(component.getOptionIcon(iconOption)).toBe('/icons/dark/home.svg');
      theme.iconTheme.set('light');

      fixture.componentRef.setInput('config', {
        type: 'tabs',
        options: [iconOption],
        selected: 'home',
        ariaLabel: 'views',
        fullWidth: true,
      });
      fixture.detectChanges();
      expect(component.isFullWidth()).toBe(true);
      expect(component.getSelectedIndex([iconOption])).toBe(0);
      expect(component.getOptionIcon({ label: 'No icon' })).toBeUndefined();
      expect(component.getOptionIcon('Plain')).toBeUndefined();
      fixture.componentRef.setInput('config', {
        type: 'tabs',
        options: ['First', 'Second'],
        selected: null,
        ariaLabel: 'views',
      });
      fixture.detectChanges();
      expect(component.selected()).toBe('First');
      fixture.componentRef.setInput('config', {
        type: 'tabs',
        options: [],
        selected: null,
        ariaLabel: 'views',
      });
      fixture.detectChanges();
      expect(component.selected()).toBeNull();

      fixture.componentRef.setInput('config', { type: 'theme' });
      fixture.detectChanges();
      expect(component.selected()).toBeNull();
      expect(component.selectionConfig()).toBeNull();
      component.select('ignored');
      component.toggle();
    });
  });

  it('toggles switch values and ignores unsupported or disabled actions', () => {
    expectComponentCreation(PlatformToggleComponent, (fixture) => {
      const component = fixture.componentInstance;
      const toggled: boolean[] = [];
      component.toggleChange.subscribe((value) => toggled.push(value));

      component.toggle();
      component.select('ignored');
      expect(toggled).toEqual([]);

      fixture.componentRef.setInput('config', {
        type: 'switch',
        value: false,
        ariaLabel: 'toggle',
      });
      fixture.detectChanges();
      component.toggle();
      expect(component.checked()).toBe(true);
      expect(toggled).toEqual([true]);

      fixture.componentRef.setInput('config', {
        type: 'switch',
        value: true,
        ariaLabel: 'toggle',
        disabled: true,
      });
      fixture.detectChanges();
      component.toggle();
      expect(toggled).toEqual([true]);
      component.select('ignored');
      expect(component.switchConfig()?.disabled).toBe(true);
    });
  });
});
