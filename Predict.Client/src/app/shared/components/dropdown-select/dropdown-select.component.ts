import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  computed,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnDestroy,
  TemplateRef,
  ViewContainerRef,
  ChangeDetectionStrategy,
  input,
  output,
  viewChild,
  linkedSignal,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'p-dropdown-select',
  templateUrl: './dropdown-select.component.html',
  styleUrls: ['./dropdown-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgbDropdownModule, FormsModule, CommonModule],
})
export class DropdownSelectComponent implements AfterViewInit, OnDestroy {
  readonly items = input.required<string[]>();
  readonly selectedItemInput = input('', { alias: 'selectedItem' });
  readonly selectedItem = linkedSignal(() => this.selectedItemInput());
  readonly placeholder = input('Select');
  readonly dropUp = input<boolean>(false);

  readonly selectionChange = output<string>();

  readonly dropdownToggle = viewChild.required<ElementRef>('dropdownToggle');
  readonly dropdownContainer =
    viewChild.required<ElementRef>('dropdownContainer');
  readonly dropdownTemplate =
    viewChild.required<TemplateRef<any>>('dropdownTemplate');

  readonly searchTerm = signal('');
  readonly isOpen = signal(false);
  readonly filteredItems = computed(() => {
    const searchTerm = this.searchTerm().trim().toLowerCase();
    if (!searchTerm) return this.items();
    return this.items().filter((item) =>
      item.toLowerCase().includes(searchTerm),
    );
  });

  private overlayRef: OverlayRef | null = null;
  private portal: TemplatePortal<any> | null = null;
  private readonly overlay = inject(Overlay);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly destroyRef = inject(DestroyRef);

  ngAfterViewInit() {
    // Create overlay
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.dropdownToggle().nativeElement)
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          offsetY: 5,
        },
        {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'bottom',
          offsetY: -5,
        },
      ])
      .withFlexibleDimensions(true)
      .withPush(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
    });

    // Close on backdrop click
    this.overlayRef
      .backdropClick()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.closeDropdown());

    // Create portal
    this.portal = new TemplatePortal(
      this.dropdownTemplate(),
      this.viewContainerRef,
    );

    // Set initial width
    this.updateDropdownWidth();
  }

  ngOnDestroy() {
    if (this.overlayRef) {
      this.overlayRef.detach();
      this.overlayRef.dispose();
    }
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    if (this.isOpen()) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  openDropdown() {
    if (!this.overlayRef || !this.portal) return;

    this.isOpen.set(true);
    this.overlayRef.attach(this.portal);
    this.updateDropdownWidth();
  }

  closeDropdown() {
    if (this.overlayRef) {
      this.overlayRef.detach();
    }
    this.isOpen.set(false);
    this.searchTerm.set('');
  }

  updateDropdownWidth() {
    const dropdownToggle = this.dropdownToggle();
    if (!this.overlayRef || !dropdownToggle) return;

    const width = dropdownToggle.nativeElement.offsetWidth;
    const overlayElement = this.overlayRef.overlayElement;
    if (overlayElement) {
      overlayElement.style.width = width + 'px';
      overlayElement.style.minWidth = '200px';
    }
  }

  selectItem(item: string) {
    this.selectedItem.set(item);
    this.selectionChange.emit(item);
    this.searchTerm.set('');
    this.closeDropdown();
  }

  onSearchKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.closeDropdown();
    }
    event.stopPropagation();
  }
}
