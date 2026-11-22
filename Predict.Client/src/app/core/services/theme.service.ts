import { DOCUMENT } from '@angular/common';
import { computed, inject, Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dim' | 'dark';

const THEME_STORAGE_KEY = 'theme';
const THEMES: readonly Theme[] = ['light', 'dim', 'dark'];
const THEME_LABELS: Record<Theme, string> = {
  light: 'Light',
  dim: 'Dim',
  dark: 'Dark',
};

function isTheme(value: string | null | undefined): value is Theme {
  return value === 'light' || value === 'dim' || value === 'dark';
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly view = this.document.defaultView;
  private readonly themeSignal = signal<Theme>('light');
  private mediaQuery: MediaQueryList | null = null;
  private manuallyChosen = false;

  readonly theme = this.themeSignal.asReadonly();
  readonly themeLabel = computed(() => THEME_LABELS[this.themeSignal()]);
  readonly iconTheme = computed(() =>
    this.themeSignal() === 'light' ? 'light' : 'dark',
  );

  private readonly handleSystemPreferenceChange = (
    event: MediaQueryListEvent,
  ) => {
    if (!this.manuallyChosen) {
      this.applyTheme(event.matches ? 'dark' : 'light');
    }
  };

  constructor() {
    const savedTheme = this.view?.localStorage.getItem(THEME_STORAGE_KEY);

    if (isTheme(savedTheme)) {
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
    const currentIndex = THEMES.indexOf(this.getCurrentTheme());
    this.setTheme(THEMES[(currentIndex + 1) % THEMES.length]);
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
