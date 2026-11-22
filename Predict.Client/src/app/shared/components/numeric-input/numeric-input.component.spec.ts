import { Validators } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { NumericInputComponent } from './numeric-input.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('NumericInputComponent', () => {
  it('should create', () => {
    expectComponentCreation(NumericInputComponent);
  });

  it('formats entered values and emits changes', () => {
    expectComponentCreation(NumericInputComponent, (fixture) => {
      const component = fixture.componentInstance;
      const control = component.control();
      const emitted: (number | null)[] = [];
      component.valueChange.subscribe((value) => emitted.push(value));

      component.onInput({ target: { value: '' } } as unknown as Event);
      component.onInput({ target: { value: '12.345' } } as unknown as Event);
      component.onInput({ target: { value: 'invalid' } } as unknown as Event);
      component.onBlur({ target: { value: '12.345' } } as unknown as Event);
      component.onBlur({ target: { value: '8' } } as unknown as Event);
      component.onBlur({ target: { value: '' } } as unknown as Event);
      expect(emitted).toEqual([null, 12.345, null, 12.35]);
      expect(control.value).toBe(12.35);
    });
  });

  it('shows the validation state and message for each supported error', () => {
    expectComponentCreation(NumericInputComponent, (fixture) => {
      const control = fixture.componentInstance.control();
      control.setValidators([
        Validators.required,
        Validators.min(5),
        Validators.max(10),
      ]);
      control.markAsUntouched();
      control.markAsPristine();
      control.setValue(null);
      fixture.detectChanges();
      expect(fixture.componentInstance.hasValidationError()).toBe(false);
      control.markAsDirty();
      fixture.detectChanges();
      expect(fixture.componentInstance.hasValidationError()).toBe(true);
      control.updateValueAndValidity();
      control.markAsTouched();
      fixture.detectChanges();

      control.setValue(null);
      fixture.detectChanges();
      expect(fixture.componentInstance.hasValidationError()).toBe(true);
      expect(fixture.componentInstance.validationMessage()).toBe('Required');

      control.setValue(2);
      fixture.detectChanges();
      expect(fixture.componentInstance.validationMessage()).toBe('Min: 5');

      control.setValue(20);
      fixture.detectChanges();
      expect(fixture.componentInstance.validationMessage()).toBe('Max: 10');

      control.setValidators(Validators.pattern(/^\d{3}$/));
      control.setValue(12);
      fixture.detectChanges();
      expect(fixture.componentInstance.validationMessage()).toBe(
        'Invalid number',
      );
    });
  });
});
