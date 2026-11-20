import { screen } from '@testing-library/react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderInEnglish } from '../test/english';
import { CameraButton } from './CameraButton';

describe('CameraButton', () => {
  it('is a link to the camera with only an icon, named for screen readers', () => {
    render(<CameraButton />);
    const link = screen.getByRole('link', { name: 'Detector de baches' });
    expect(link.getAttribute('href')).toBe('/camara');
    expect(link.getAttribute('title')).toBe('Detector de baches');
    expect(link.textContent).toBe('');
    expect(link.querySelector('svg')).toBeTruthy();
  });

  it('is named in English when the language is English', () => {
    renderInEnglish(<CameraButton />);
    expect(screen.getByRole('link', { name: 'Pothole detector' })).toBeTruthy();
  });
});
