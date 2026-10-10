import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  signal,
} from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';

export interface PlatformToggleOption {
  label: string;
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
    '[class.platform-toggle--full-width]':
      'config?.type !== "switch" && config?.type !== "theme" && config?.fullWidth === true',
  },
})
export class PlatformToggleComponent implements OnChanges {
  readonly themeService = inject(ThemeService);

  @Input({ required: true }) config!: PlatformToggleConfig;
  @Output() toggleChange = new EventEmitter<boolean>();
  @Output() selectionChange = new EventEmitter<string>();

  readonly checked = signal(false);
  readonly selected = signal<string | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    const configChange = changes['config'];
    if (!configChange) return;

    if (this.config.type === 'switch') {
      this.checked.set(this.config.value);
      return;
    }
    if (this.config.type === 'theme') return;

    const previous = configChange.previousValue as
      PlatformToggleConfig | undefined;
    const labels = this.config.options.map((option) =>
      this.getOptionLabel(option),
    );
    const currentSelection = this.selected();

    if (
      !previous ||
      previous.type === 'switch' ||
      previous.type !== this.config.type ||
      previous.selected !== this.config.selected ||
      !labels.includes(currentSelection ?? '')
    ) {
      this.selected.set(this.config.selected ?? labels[0] ?? null);
    }
  }

  toggle(): void {
    if (this.config.type !== 'switch' || this.config.disabled) return;

    const value = !this.checked();
    this.checked.set(value);
    this.toggleChange.emit(value);
  }

  select(option: string | PlatformToggleOption): void {
    if (
      this.config.type === 'switch' ||
      this.config.type === 'theme' ||
      this.config.disabled
    ) {
      return;
    }

    const value = this.getOptionLabel(option);
    this.selected.set(value);
    this.selectionChange.emit(value);
  }

  getOptionLabel(option: string | PlatformToggleOption): string {
    return typeof option === 'string' ? option : option.label;
  }

  getOptionIcon(option: string | PlatformToggleOption): string | undefined {
    if (typeof option === 'string' || !option.iconPath) return undefined;

    const theme = this.themeService.theme() === 'light' ? 'light' : 'dark';
    return option.iconPath.replace(/\/icons\//i, `/icons/${theme}/`);
  }

  getSelectedIndex(options: (string | PlatformToggleOption)[]): number {
    return options.findIndex(
      (option) => this.getOptionLabel(option) === this.selected(),
    );
  }

  getGradient(config: PlatformSelectionConfig): string {
    const primary = config.gradient?.primaryColor ?? '#c61a54';
    const secondary = config.gradient?.secondaryColor ?? '#d5a326';
    return `linear-gradient(135deg, ${primary}, ${secondary})`;
  }
}
