import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { LanguageProvider } from './LanguageProvider';
import { LanguageSwitch } from './LanguageSwitch';

function renderSwitch() {
  return render(
    <LanguageProvider>
      <LanguageSwitch />
    </LanguageProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('LanguageSwitch', () => {
  it('is a labelled group with one button for each language, named in its own language', () => {
    renderSwitch();

    const group = screen.getByRole('group', { name: 'Idioma' });
    const buttons = group.querySelectorAll('button');
    expect([...buttons].map((button) => button.textContent)).toEqual(['Español', 'English']);
    expect([...buttons].map((button) => button.lang)).toEqual(['es', 'en']);
  });

  it('marks Spanish as the chosen one at first', () => {
    renderSwitch();

    expect(screen.getByRole('button', { name: 'Español' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(screen.getByRole('button', { name: 'English' }).getAttribute('aria-pressed')).toBe(
      'false',
    );
  });

  it('changes to English with its button, and the group name changes with it', () => {
    renderSwitch();

    fireEvent.click(screen.getByRole('button', { name: 'English' }));

    expect(screen.getByRole('button', { name: 'English' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(screen.getByRole('button', { name: 'Español' }).getAttribute('aria-pressed')).toBe(
      'false',
    );
    expect(screen.getByRole('group', { name: 'Language' })).toBeTruthy();
    expect(document.documentElement.lang).toBe('en');
    expect(window.localStorage.getItem('urban-road-monitor.language')).toBe('en');
  });

  it('goes back to Spanish', () => {
    renderSwitch();

    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    fireEvent.click(screen.getByRole('button', { name: 'Español' }));

    expect(screen.getByRole('button', { name: 'Español' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(screen.getByRole('group', { name: 'Idioma' })).toBeTruthy();
  });

  it('keeps the chosen language when the chosen button is pressed again', () => {
    renderSwitch();

    fireEvent.click(screen.getByRole('button', { name: 'Español' }));
    fireEvent.click(screen.getByRole('button', { name: 'Español' }));

    expect(screen.getByRole('button', { name: 'Español' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(document.documentElement.lang).toBe('es');
  });

  it('shows the language saved in an earlier visit', () => {
    window.localStorage.setItem('urban-road-monitor.language', 'en');
    renderSwitch();

    expect(screen.getByRole('button', { name: 'English' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(screen.getByRole('group', { name: 'Language' })).toBeTruthy();
  });

  it('is shown in Spanish, with nothing to change, when no provider is above it', () => {
    render(<LanguageSwitch />);

    fireEvent.click(screen.getByRole('button', { name: 'English' }));

    expect(screen.getByRole('button', { name: 'Español' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
  });
});
