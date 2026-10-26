import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LoadingScreen } from './LoadingScreen';

describe('LoadingScreen', () => {
  it('says that the map is loading and shows the road of the request', () => {
    render(<LoadingScreen slow={false} />);
    expect(screen.getByText('Cargando el mapa…')).toBeTruthy();
    expect(screen.getByRole('list', { name: 'Recorrido de la petición' })).toBeTruthy();
  });

  it('is marked as busy for assistive technology', () => {
    const { container } = render(<LoadingScreen slow={false} />);
    expect(container.querySelector('[aria-busy="true"]')).toBeTruthy();
  });

  it('does not mention the sleeping server at first', () => {
    render(<LoadingScreen slow={false} />);
    expect(screen.queryByText(/despertando/)).toBeNull();
  });

  it('explains the sleeping server when the request is slow', () => {
    render(<LoadingScreen slow />);
    expect(screen.getByText(/despertando/)).toBeTruthy();
  });

  it('waits for the server and the database', () => {
    const { container } = render(<LoadingScreen slow={false} />);
    expect(container.querySelectorAll('.route__stop--pending')).toHaveLength(2);
  });
});
