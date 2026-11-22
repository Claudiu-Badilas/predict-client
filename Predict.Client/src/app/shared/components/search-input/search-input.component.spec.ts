import { describe, expect, it, vi } from 'vitest';
import { SearchInputComponent } from './search-input.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('SearchInputComponent', () => {
  it('should create', () => {
    expectComponentCreation(SearchInputComponent);
  });

  it('debounces input and clears the query immediately', () => {
    expectComponentCreation(SearchInputComponent, (fixture) => {
      vi.useFakeTimers();
      try {
        const component = fixture.componentInstance;
        const emitted: string[] = [];
        component.search.subscribe((value) => emitted.push(value));

        component.onInput({ target: { value: 'coffee' } } as unknown as Event);
        expect(component.query()).toBe('coffee');
        vi.advanceTimersByTime(499);
        expect(emitted).toEqual([]);
        vi.advanceTimersByTime(1);
        expect(emitted).toEqual(['coffee']);

        component.onInput({ target: { value: 'tea' } } as unknown as Event);
        component.clear();
        expect(component.query()).toBe('');
        expect(emitted).toEqual(['coffee', '']);
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
