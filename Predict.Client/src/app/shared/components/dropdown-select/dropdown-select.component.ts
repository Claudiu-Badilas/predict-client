import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { CommonModule, DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnDestroy,
  Output,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'p-dropdown-select',
  templateUrl: './dropdown-select.component.html',
  styleUrls: ['./dropdown-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [NgbDropdownModule, FormsModule, CommonModule],
})
export class DropdownSelectComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) items: string[] = [];
  @Input() selectedItem: string = '';
  @Input() placeholder = 'Select';
  @Input() dropUp: boolean = false;

  @Output() selectionChange = new EventEmitter<string>();

  @ViewChild('dropdownToggle') dropdownToggle!: ElementRef;
  @ViewChild('dropdownContainer') dropdownContainer!: ElementRef;
  @ViewChild('dropdownTemplate') dropdownTemplate!: TemplateRef<any>;

  searchTerm: string = '';
  isOpen: boolean = false;
  shouldDropUp: boolean = false;

  private overlayRef: OverlayRef | null = null;
  private portal: TemplatePortal<any> | null = null;

  constructor(
    private overlay: Overlay,
    private viewContainerRef: ViewContainerRef,
    private cdr: ChangeDetectorRef,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  ngAfterViewInit() {
    // Create overlay
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.dropdownToggle.nativeElement)
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
    this.overlayRef.backdropClick().subscribe(() => {
      this.closeDropdown();
    });

    // Create portal
    this.portal = new TemplatePortal(
      this.dropdownTemplate,
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
    if (this.isOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  openDropdown() {
    if (!this.overlayRef || !this.portal) return;

    this.isOpen = true;
    this.overlayRef.attach(this.portal);
    this.updateDropdownWidth();
    this.cdr.detectChanges();
  }

  closeDropdown() {
    if (this.overlayRef) {
      this.overlayRef.detach();
    }
    this.isOpen = false;
    this.searchTerm = '';
    this.cdr.detectChanges();
  }

  updateDropdownWidth() {
    if (!this.overlayRef || !this.dropdownToggle) return;

    const width = this.dropdownToggle.nativeElement.offsetWidth;
    const overlayElement = this.overlayRef.overlayElement;
    if (overlayElement) {
      overlayElement.style.width = width + 'px';
      overlayElement.style.minWidth = '200px';
    }
  }

  selectItem(item: string) {
    this.selectedItem = item;
    this.selectionChange.emit(item);
    this.searchTerm = '';
    this.closeDropdown();
  }

  filteredItems() {
    if (!this.searchTerm || this.searchTerm === '') return this.items;
    return this.items.filter((item) =>
      item.toLowerCase().includes(this.searchTerm.toLowerCase()),
    );
  }

  onSearchKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.closeDropdown();
    }
    event.stopPropagation();
  }
}
