import { describe, expect, it, vi } from 'vitest';
import { SeasonalEffectComponent } from './seasonal-effect.component';
import { expectComponentCreation } from 'src/app/testing/component-test-setup';

describe('SeasonalEffectComponent', () => {
  it('should create', () => {
    expectComponentCreation(SeasonalEffectComponent);
  });

  it('cycles snow and leaf particles and ignores non-element events', () => {
    expectComponentCreation(SeasonalEffectComponent, (fixture) => {
      const component = fixture.componentInstance;
      const particle = document.createElement('span');
      const random = vi.spyOn(Math, 'random').mockReturnValue(0);

      component.cycleParticle(
        { currentTarget: particle } as unknown as Event,
        'snow',
      );
      expect(particle.textContent).toBe(component['snowParticles'][0]);
      component.cycleParticle(
        { currentTarget: particle } as unknown as Event,
        'leaf',
      );
      expect(particle.textContent).toBe(component['leafParticles'][0]);
      component.cycleParticle(
        { currentTarget: null } as unknown as Event,
        'snow',
      );
      expect(particle.textContent).toBe(component['leafParticles'][0]);

      random.mockRestore();
    });
  });

  it('updates the season for autumn, winter, and spring-summer months', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date(2024, 8, 1));
      expectComponentCreation(SeasonalEffectComponent, () => {
        expect(document.documentElement.dataset['season']).toBe('autumn');
        vi.setSystemTime(new Date(2024, 10, 1));
        vi.advanceTimersByTime(60 * 60 * 1000);
        expect(document.documentElement.dataset['season']).toBe('winter');
        vi.setSystemTime(new Date(2024, 1, 1));
        vi.advanceTimersByTime(60 * 60 * 1000);
        expect(document.documentElement.dataset['season']).toBe('winter');
        vi.setSystemTime(new Date(2024, 5, 1));
        vi.advanceTimersByTime(60 * 60 * 1000);
        expect(document.documentElement.dataset['season']).toBe(
          'spring-summer',
        );
      });
    } finally {
      vi.useRealTimers();
    }
  });
});
