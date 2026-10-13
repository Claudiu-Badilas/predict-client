import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { ThemeService } from 'src/app/core/services/theme.service';
import { PlatformToggleComponent } from '../platform-toggle/platform-toggle.component';
import * as NavigationAction from 'src/app/store/actions/navigation.actions';
import * as fromAppStore from 'src/app/store/app-state.reducer';

@Component({
  selector: 'p-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, PlatformToggleComponent],
})
export class TopBarComponent implements OnInit {
  @Input() hasModuleNavContent: boolean = false;
  @Input() hasFiltersContent: boolean = false;

  private readonly themeService = inject(ThemeService);

  modules = [
    { label: 'Simulator', icon: 'home', url: '/loan/overview' },
    { label: 'Detailed', icon: 'wallet', url: '/loan/detailed' },
    { label: 'Daily Goals', icon: 'calendar', url: '/daily-goals' },
    { label: 'Transac.', icon: 'trending', url: '/transactions' },
    { label: 'Receipts', icon: 'receipt', url: '/receipts' },
  ];

  isMenuOpen = false;
  isFilterPanelOpen = false;
  isAnimating = false;
  currentUrl: string = '';

  constructor(
    private store: Store<fromAppStore.AppState>,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.currentUrl = this.router.url;

    this.router.events.subscribe(() => {
      this.currentUrl = this.router.url;
    });
  }

  isActiveRoute(url: string): boolean {
    if (url === '/') {
      return this.currentUrl === '/';
    }
    return this.currentUrl.startsWith(url);
  }

  /**
   * Toggle the mobile navigation menu
   * When burger menu is clicked:
   * 1. If filter panel is open, close it first
   * 2. Open the navigation menu
   */
  toggleMenu() {
    // If filter panel is open, close it first
    if (this.isFilterPanelOpen) {
      this.closeFilterPanel();
    }

    // Open the navigation menu (always opens when burger is clicked)
    // This ensures the user can always access navigation
    this.isMenuOpen = true;
  }

  /** Toggle the mobile navigation and filter panel together. */
  toggleMobileControls() {
    if (this.isAnimating) return;

    const shouldOpen = !(this.isMenuOpen && this.isFilterPanelOpen);
    this.isMenuOpen = shouldOpen;
    this.isFilterPanelOpen = shouldOpen && this.hasFiltersContent;

    if (this.isFilterPanelOpen) {
      this.isAnimating = true;
      requestAnimationFrame(() => {
        this.isAnimating = false;
        this.cdr.detectChanges();
      });
    }

    this.cdr.detectChanges();
  }

  /**
   * Close the mobile navigation menu
   */
  closeMenu() {
    this.isMenuOpen = false;
  }

  /**
   * Toggle the filter panel
   * When filter button is clicked:
   * 1. If menu is open, close it
   * 2. Toggle filter panel
   */
  toggleFilterPanel() {
    if (this.isAnimating) return;

    // Close menu when opening filter
    if (this.isMenuOpen) {
      this.closeMenu();
    }

    this.isFilterPanelOpen = !this.isFilterPanelOpen;

    // Trigger animation state
    if (this.isFilterPanelOpen) {
      this.isAnimating = true;
      // Use requestAnimationFrame for smoother animation
      requestAnimationFrame(() => {
        this.isAnimating = false;
        this.cdr.detectChanges();
      });
    }

    this.cdr.detectChanges();
  }

  /**
   * Open the filter panel
   */
  openFilterPanel() {
    if (this.isAnimating) return;

    // Close menu if open
    if (this.isMenuOpen) {
      this.closeMenu();
    }

    this.isFilterPanelOpen = true;
    this.cdr.detectChanges();
  }

  /**
   * Close the filter panel
   */
  closeFilterPanel() {
    if (this.isAnimating) return;
    this.isFilterPanelOpen = false;
    this.cdr.detectChanges();
  }

  onNavigateTo(url: any) {
    this.store.dispatch(NavigationAction.navigateTo({ route: url }));
  }

  getThemeIconPath(icon: string): string {
    return `assets/icons/${this.themeService.theme()}/${icon}.svg`;
  }
}
