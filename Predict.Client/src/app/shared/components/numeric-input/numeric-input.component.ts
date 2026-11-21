import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { map, startWith, switchMap } from 'rxjs';

interface NumericControlState {
  invalid: boolean;
  touched: boolean;
  dirty: boolean;
  required: boolean;
  minimum?: number;
  maximum?: number;
}

@Component({
  selector: 'p-numeric-input',
  imports: [ReactiveFormsModule],
  templateUrl: './numeric-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./numeric-input.component.scss'],
})
export class NumericInputComponent {
  readonly label = input('');
  readonly disabled = input(false);
  readonly control = input.required<FormControl<number | null>>();

  readonly valueChange = output<number | null>();

  private readonly controlState = toSignal(
    toObservable(this.control).pipe(
      switchMap((control) =>
        control.events.pipe(
          startWith(null),
          map(() => ({
            invalid: control.invalid,
            touched: control.touched,
            dirty: control.dirty,
            required: control.hasError('required'),
            minimum: control.getError('min')?.min as number | undefined,
            maximum: control.getError('max')?.max as number | undefined,
          })),
        ),
      ),
    ),
    {
      initialValue: {
        invalid: false,
        touched: false,
        dirty: false,
        required: false,
        minimum: undefined,
        maximum: undefined,
      } satisfies NumericControlState,
    },
  );

  readonly hasValidationError = computed(() => {
    const state = this.controlState();
    return state.invalid && (state.touched || state.dirty);
  });

  readonly validationMessage = computed(() => {
    const state = this.controlState();
    if (state.required) {
      return 'Required';
    }

    if (state.minimum !== undefined) {
      return `Min: ${state.minimum}`;
    }

    if (state.maximum !== undefined) {
      return `Max: ${state.maximum}`;
    }

    return 'Invalid number';
  });

  onInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let newValue = input.value === '' ? null : Number(input.value);

    if (newValue !== null && isNaN(newValue)) {
      newValue = null;
    }

    this.control().setValue(newValue);
    this.valueChange.emit(newValue);
  }

  onBlur(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.value !== '' && !isNaN(Number(input.value))) {
      const numValue = Number(input.value);
      const formatted = Math.round(numValue * 100) / 100;
      if (formatted !== numValue) {
        this.control().setValue(formatted);
        this.valueChange.emit(formatted);
      }
    }
  }
}
