import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  inject,
  ChangeDetectionStrategy,
  input,
  signal,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { ThemeService } from 'src/app/core/services/theme.service';
import { PlatformToggleComponent } from '../platform-toggle/platform-toggle.component';

@Component({
  selector: 'p-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, PlatformToggleComponent],
})
export class TopBarComponent {
  readonly hasModuleNavContent = input<boolean>(false);
  readonly hasFiltersContent = input<boolean>(false);

  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);
  readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  modules = [
    { label: 'Simulator', icon: 'home', url: '/loan/overview' },
    { label: 'Detailed', icon: 'wallet', url: '/loan/detailed' },
    // { label: 'Goals', icon: 'calendar', url: '/daily-goals' },
    { label: 'Transac.', icon: 'trending', url: '/transactions' },
    { label: 'Receipts', icon: 'receipt', url: '/receipts' },
  ];

  readonly isMenuOpen = signal(false);
  readonly isFilterPanelOpen = signal(false);
  readonly isAnimating = signal(false);
  readonly isMobileControlsOpen = computed(
    () => this.isMenuOpen() || this.isFilterPanelOpen(),
  );

  isActiveRoute(url: string): boolean {
    if (url === '/') {
      return this.currentUrl() === '/';
    }
    return this.currentUrl().startsWith(url);
  }

  /** Toggle the mobile navigation and filter panel together. */
  toggleMobileControls() {
    if (this.isAnimating()) return;

    const shouldOpen = !this.isMobileControlsOpen();
    this.isMenuOpen.set(shouldOpen);
    this.isFilterPanelOpen.set(shouldOpen && this.hasFiltersContent());

    if (this.isFilterPanelOpen()) {
      this.isAnimating.set(true);
      requestAnimationFrame(() => {
        this.isAnimating.set(false);
      });
    }
  }

  /**
   * Close the mobile navigation menu
   */
  closeMenu() {
    this.isMenuOpen.set(false);
  }

  /**
   * Toggle the filter panel
   * When filter button is clicked:
   * 1. If menu is open, close it
   * 2. Toggle filter panel
   */
  toggleFilterPanel() {
    if (this.isAnimating()) return;

    // Close menu when opening filter
    if (this.isMenuOpen()) {
      this.closeMenu();
    }

    this.isFilterPanelOpen.update((open) => !open);

    // Trigger animation state
    if (this.isFilterPanelOpen()) {
      this.isAnimating.set(true);
      // Use requestAnimationFrame for smoother animation
      requestAnimationFrame(() => {
        this.isAnimating.set(false);
      });
    }
  }

  onNavigateTo(url: string): void {
    void this.router.navigateByUrl(url);
  }

  getThemeIconPath(icon: string): string {
    return `assets/icons/${this.themeService.iconTheme()}/${icon}.svg`;
  }
}
