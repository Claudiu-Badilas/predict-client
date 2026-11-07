import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  ViewEncapsulation,
} from '@angular/core';

type ParticleType = 'snow' | 'leaf';

@Component({
  selector: 'p-seasonal-effect',
  templateUrl: './seasonal-effect.component.html',
  styleUrls: ['./seasonal-effect.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  encapsulation: ViewEncapsulation.None,
})
export class SeasonalEffectComponent implements OnDestroy {
  readonly snowParticles = ['❄', '❅', '❆', '✳', '✣', '✤', '✥', '✢'];
  readonly leafParticles = ['🍂', '🍁', '🍃', '❧', '❦', '✿', '❀', '❁'];

  private readonly snowPatterns = [
    '❄',
    '❅',
    '❆',
    '✳',
    '✣',
    '✤',
    '✥',
    '✢',
    '✧',
    '✩',
    '✪',
    '✫',
    '✬',
    '✭',
    '✮',
    '✯',
    '✰',
    '✱',
    '✲',
    '✴',
    '✵',
    '✶',
    '✷',
    '✸',
    '✹',
    '✺',
    '✻',
    '✼',
    '✽',
    '❉',
    '❊',
    '❋',
    '۞',
    '⁕',
    '⁂',
    '✦',
  ];
  private readonly leafPatterns = [
    '🍂',
    '🍁',
    '🍃',
    '🍀',
    '☘',
    '❧',
    '❦',
    '❡',
    '⚘',
    '✿',
    '❀',
    '❁',
    '❃',
    '❋',
    '✤',
    '✥',
    '✣',
    '✾',
    '❈',
    '❉',
    '❊',
    '❖',
    '♧',
    '♣',
  ];
  private readonly seasonTimer = window.setInterval(
    () => this.updateSeason(),
    60 * 60 * 1000,
  );

  constructor() {
    this.updateSeason();
  }

  ngOnDestroy(): void {
    window.clearInterval(this.seasonTimer);
  }

  cycleParticle(event: Event, type: ParticleType): void {
    const particle = event.currentTarget;
    if (!(particle instanceof HTMLElement)) return;

    const patterns = type === 'snow' ? this.snowPatterns : this.leafPatterns;
    particle.textContent =
      patterns[Math.floor(Math.random() * patterns.length)];
    particle.style.setProperty('--particle-left', `${Math.random() * 90 + 5}%`);
    particle.style.setProperty(
      '--particle-size',
      `${type === 'snow' ? 12 + Math.random() * 15 : 18 + Math.random() * 16}px`,
    );
    particle.style.setProperty(
      '--particle-duration',
      `${7 + Math.random() * 5}s`,
    );
  }

  private updateSeason(): void {
    const month = new Date().getMonth();
    const season =
      month >= 8 && month <= 9
        ? 'autumn'
        : month === 10 || month <= 1
          ? 'winter'
          : 'spring-summer';
    document.documentElement.dataset['season'] = season;
  }
}
