import {
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';

@Component({
  selector: 'p-search-input',
  imports: [],
  templateUrl: './search-input.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./search-input.component.scss'],
})
export class SearchInputComponent {
  @Output() search = new EventEmitter<string>();

  query = signal('');

  @Input() set value(value: string) {
    this.query.set(value);
  }

  private debounceTimer: any;

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
