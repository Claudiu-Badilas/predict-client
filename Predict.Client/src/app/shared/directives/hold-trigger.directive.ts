import { Directive, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({ selector: '[holdTrigger]' })
export class HoldTriggerDirective {
  @Output() holdTrigger = new EventEmitter<void>();

  private timeout: any;
  private holdTime = 800;

  @HostListener('mousedown')
  @HostListener('touchstart')
  startHold() {
    this.timeout = setTimeout(() => {
      this.holdTrigger.emit();
    }, this.holdTime);
  }

  @HostListener('mouseup')
  @HostListener('mouseleave')
  @HostListener('touchend')
  cancelHold() {
    clearTimeout(this.timeout);
  }
}
