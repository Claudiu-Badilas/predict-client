import {
  Component,
  DestroyRef,
  inject,
  ChangeDetectionStrategy,
  output,
  input,
  linkedSignal,
} from '@angular/core';

@Component({
  selector: 'p-search-input',
  imports: [],
  templateUrl: './search-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./search-input.component.scss'],
})
export class SearchInputComponent {
  readonly search = output<string>();
  readonly value = input('');

  readonly query = linkedSignal(() => this.value());
  private readonly destroyRef = inject(DestroyRef);

  private debounceTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.destroyRef.onDestroy(() => clearTimeout(this.debounceTimer));
  }

  onInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.query.set(value);

    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.search.emit(this.query());
    }, 500);
  }

  clear() {
    this.query.set('');
    this.search.emit('');
  }
}
