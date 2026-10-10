import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly view = this.document.defaultView;
  private readonly themeSignal = signal<Theme>('light');
  private mediaQuery: MediaQueryList | null = null;
  private manuallyChosen = false;

  readonly theme = this.themeSignal.asReadonly();

  private readonly handleSystemPreferenceChange = (
    event: MediaQueryListEvent,
  ) => {
    if (!this.manuallyChosen) {
      this.applyTheme(event.matches ? 'dark' : 'light');
    }
  };

  constructor() {
    const savedTheme = this.view?.localStorage.getItem(THEME_STORAGE_KEY);

    if (savedTheme === 'light' || savedTheme === 'dark') {
      // A saved selection is explicit and must not be overridden by OS changes.
      this.manuallyChosen = true;
      this.applyTheme(savedTheme);
      return;
    }

    this.mediaQuery =
      this.view?.matchMedia('(prefers-color-scheme: dark)') ?? null;
    this.applyTheme(this.mediaQuery?.matches ? 'dark' : 'light');
    this.mediaQuery?.addEventListener(
      'change',
      this.handleSystemPreferenceChange,
    );
  }

  toggleTheme(): void {
    const themes: Theme[] = ['light', 'dark'];
    const currentIndex = themes.indexOf(this.getCurrentTheme());
    this.setTheme(themes[(currentIndex + 1) % themes.length]);
  }

  setTheme(theme: Theme): void {
    this.manuallyChosen = true;
    this.mediaQuery?.removeEventListener(
      'change',
      this.handleSystemPreferenceChange,
    );
    this.view?.localStorage.setItem(THEME_STORAGE_KEY, theme);
    this.applyTheme(theme);
  }

  getCurrentTheme(): Theme {
    return this.themeSignal();
  }

  private applyTheme(theme: Theme): void {
    this.themeSignal.set(theme);
    this.document.documentElement.setAttribute('data-theme', theme);
  }
}
