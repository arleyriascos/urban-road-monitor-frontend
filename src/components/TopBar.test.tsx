import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { statsFixture } from '../test/fixtures';
import { TopBar } from './TopBar';

describe('TopBar', () => {
  it('shows the title of the app', () => {
    render(<TopBar stats={statsFixture} />);
    expect(screen.getByRole('heading', { name: 'Estado de las calles de Pasto' })).toBeTruthy();
  });

  it('summarizes the roads, the length and the active potholes', () => {
    render(<TopBar stats={statsFixture} />);
    expect(screen.getByText('4.610 vías · 774,1 km · 54 baches activos')).toBeTruthy();
  });
});
