import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'p-numeric-input',
  imports: [ReactiveFormsModule],
  templateUrl: './numeric-input.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./numeric-input.component.scss'],
})
export class NumericInputComponent {
  @Input() label = '';
  @Input() disabled = false;
  @Input({ required: true }) control!: FormControl<number | null>;

  @Output() valueChange = new EventEmitter<number | null>();

  get hasValidationError(): boolean {
    return this.control.invalid && (this.control.touched || this.control.dirty);
  }

  get validationMessage(): string {
    if (this.control?.hasError('required')) {
      return 'Required';
    }

    if (this.control?.hasError('min')) {
      return `Min: ${this.control.getError('min').min}`;
    }

    if (this.control?.hasError('max')) {
      return `Max: ${this.control.getError('max').max}`;
    }

    return 'Invalid number';
  }

  onInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let newValue = input.value === '' ? null : Number(input.value);

    if (newValue !== null && isNaN(newValue)) {
      newValue = null;
    }

    this.control.setValue(newValue);
    this.valueChange.emit(newValue);
  }

  onBlur(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.value !== '' && !isNaN(Number(input.value))) {
      const numValue = Number(input.value);
      const formatted = Math.round(numValue * 100) / 100;
      if (formatted !== numValue) {
        this.control.setValue(formatted);
        this.valueChange.emit(formatted);
      }
    }
  }
}
