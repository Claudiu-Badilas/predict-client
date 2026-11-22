import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  linkedSignal,
  output,
  computed,
} from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';

export interface PlatformToggleOption {
  label: string;
  value?: string;
  iconPath?: string;
}

export interface PlatformSwitchConfig {
  type: 'switch';
  value: boolean;
  ariaLabel: string;
  size?: 'default' | 'xsmall';
  disabled?: boolean;
}

export interface PlatformThemeConfig {
  type: 'theme';
}

export interface PlatformSelectionConfig {
  type: 'sliding' | 'tabs' | 'toolbar';
  options: (string | PlatformToggleOption)[];
  selected: string | null;
  ariaLabel: string;
  gradient?: { primaryColor: string; secondaryColor: string };
  fullWidth?: boolean;
  disabled?: boolean;
}

export type PlatformToggleConfig =
  PlatformSwitchConfig | PlatformThemeConfig | PlatformSelectionConfig;

@Component({
  selector: 'p-platform-toggle',
  standalone: true,
  templateUrl: './platform-toggle.component.html',
  styleUrl: './platform-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.platform-toggle--full-width]': 'isFullWidth()',
  },
})
export class PlatformToggleComponent {
  readonly themeService = inject(ThemeService);

  readonly config = input.required<PlatformToggleConfig>();
  readonly switchConfig = computed(() => {
    const config = this.config();
    return config.type === 'switch' ? config : null;
  });
  readonly selectionConfig = computed(() => {
    const config = this.config();
    return config.type === 'switch' || config.type === 'theme' ? null : config;
  });
  readonly isFullWidth = computed(
    () => this.selectionConfig()?.fullWidth === true,
  );
  readonly toggleChange = output<boolean>();
  readonly selectionChange = output<string>();

  readonly checked = linkedSignal(() => {
    const config = this.config();
    return config.type === 'switch' ? config.value : false;
  });
  readonly selected = linkedSignal(() => {
    const config = this.config();
    if (config.type === 'switch' || config.type === 'theme') return null;
    const values = config.options.map((option) => this.getOptionValue(option));
    return config.selected ?? values[0] ?? null;
  });

  toggle(): void {
    const config = this.config();
    if (config.type !== 'switch' || config.disabled) return;

    const value = !this.checked();
    this.checked.set(value);
    this.toggleChange.emit(value);
  }

  select(option: string | PlatformToggleOption): void {
    const config = this.config();
    if (
      config.type === 'switch' ||
      config.type === 'theme' ||
      config.disabled
    ) {
      return;
    }

    const value = this.getOptionValue(option);
    this.selected.set(value);
    this.selectionChange.emit(value);
  }

  getOptionLabel(option: string | PlatformToggleOption): string {
    return typeof option === 'string' ? option : option.label;
  }

  getOptionValue(option: string | PlatformToggleOption): string {
    return typeof option === 'string' ? option : (option.value ?? option.label);
  }

  getOptionIcon(option: string | PlatformToggleOption): string | undefined {
    if (typeof option === 'string' || !option.iconPath) return undefined;

    const theme = this.themeService.iconTheme();
    return option.iconPath.replace(/\/icons\//i, `/icons/${theme}/`);
  }

  getSelectedIndex(options: (string | PlatformToggleOption)[]): number {
    return options.findIndex(
      (option) => this.getOptionValue(option) === this.selected(),
    );
  }

  getGradient(config: PlatformSelectionConfig): string {
    const primary = config.gradient?.primaryColor ?? '#c61a54';
    const secondary = config.gradient?.secondaryColor ?? '#d5a326';
    return `linear-gradient(135deg, ${primary}, ${secondary})`;
  }
}
