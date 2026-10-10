import { Directive, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[tripleClick]',
})
export class TripleClickDirective {
  private clicks = 0;
  private timer: any;

  @Output() tripleClick = new EventEmitter<void>();

  @HostListener('click')
  onClick() {
    this.clicks++;
    clearTimeout(this.timer);

    this.timer = setTimeout(() => (this.clicks = 0), 200);

    if (this.clicks === 3) {
      this.tripleClick.emit();
      this.clicks = 0;
    }
  }
}
