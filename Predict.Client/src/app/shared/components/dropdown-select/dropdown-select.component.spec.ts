import { describe, expect, it, vi } from 'vitest';
import { DropdownSelectComponent } from './dropdown-select.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('DropdownSelectComponent', () => {
  it('should create', () => {
    expectComponentCreation(DropdownSelectComponent);
  });

  it('filters options, opens and closes the overlay, and emits a selected item', () => {
    expectComponentCreation(DropdownSelectComponent, (fixture) => {
      const component = fixture.componentInstance;
      const chosen: string[] = [];
      component.selectionChange.subscribe((value) => chosen.push(value));
      fixture.componentRef.setInput('items', [
        'Rent',
        'Groceries',
        'Utilities',
      ]);
      fixture.componentRef.setInput('selectedItem', 'Rent');
      fixture.detectChanges();

      expect(component.selectedItem()).toBe('Rent');
      expect(component.filteredItems()).toEqual([
        'Rent',
        'Groceries',
        'Utilities',
      ]);
      component.searchTerm.set('  RO ');
      expect(component.filteredItems()).toEqual(['Groceries']);

      const stopPropagation = vi.fn();
      component.toggleDropdown({ stopPropagation } as unknown as Event);
      expect(stopPropagation).toHaveBeenCalledOnce();
      expect(component.isOpen()).toBe(true);
      expect(component.searchTerm()).toBe('  RO ');

      component.selectItem('Groceries');
      expect(component.selectedItem()).toBe('Groceries');
      expect(component.searchTerm()).toBe('');
      expect(component.isOpen()).toBe(false);
      expect(chosen).toEqual(['Groceries']);

      component.openDropdown();
      expect(component.isOpen()).toBe(true);
      component.toggleDropdown({ stopPropagation } as unknown as Event);
      expect(component.isOpen()).toBe(false);
      component.searchTerm.set('rent');
      component.onSearchKeydown({
        key: 'Escape',
        stopPropagation,
      } as unknown as KeyboardEvent);
      expect(component.isOpen()).toBe(false);
      expect(component.searchTerm()).toBe('');
      component.openDropdown();
      component.onSearchKeydown({
        key: 'ArrowDown',
        stopPropagation,
      } as unknown as KeyboardEvent);
      expect(component.isOpen()).toBe(true);

      const overlay = component as unknown as {
        overlayRef: {
          backdropClick: () => { next: () => void };
          overlayElement: { style: CSSStyleDeclaration } | null;
        } | null;
        portal: object | null;
      };
      overlay.overlayRef?.backdropClick().next();
      expect(component.isOpen()).toBe(false);
      const overlayRef = overlay.overlayRef;
      const portal = overlay.portal;
      overlay.overlayRef = null;
      component.openDropdown();
      component.closeDropdown();
      component.updateDropdownWidth();
      component.ngOnDestroy();
      overlay.overlayRef = overlayRef;
      overlay.portal = null;
      component.openDropdown();
      overlay.portal = portal;
      if (overlay.overlayRef) {
        overlay.overlayRef.overlayElement = null;
        component.updateDropdownWidth();
      }
      component.ngOnDestroy();
    });
  });
});
