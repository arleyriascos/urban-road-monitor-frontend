import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '../types/auth';
import { AccountBadge } from './AccountBadge';

const ana: AuthUser = {
  id: 'u1',
  email: 'ana@example.com',
  fullName: 'Ana Pérez',
  avatarUrl: 'https://lh3.googleusercontent.com/a/photo=s96-c',
  roles: ['colaborador', 'usuario'],
};

const actions = () => ({ onSignOut: vi.fn(), onSignIn: vi.fn() });

describe('AccountBadge, signed in', () => {
  it('shows the name, the most powerful role and the photo', () => {
    const { container } = render(<AccountBadge user={ana} {...actions()} />);

    expect(screen.getByText('Ana Pérez')).toBeTruthy();
    expect(screen.getByText('Colaborador')).toBeTruthy();
    const photo = container.querySelector('img');
    expect(photo?.getAttribute('src')).toBe(ana.avatarUrl);
    expect(photo?.getAttribute('referrerpolicy')).toBe('no-referrer');
    expect(photo?.getAttribute('alt')).toBe('');
  });

  it('keeps the email as a tooltip, not on the screen', () => {
    render(<AccountBadge user={ana} {...actions()} />);

    expect(screen.queryByText('ana@example.com')).toBeNull();
    expect(screen.getByTitle('ana@example.com')).toBeTruthy();
  });

  it('shows the initials when there is no photo', () => {
    const { container } = render(
      <AccountBadge user={{ ...ana, avatarUrl: null }} {...actions()} />,
    );

    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('AP')).toBeTruthy();
  });

  it.each(['http://example.com/a.png', 'javascript:alert(1)'])(
    'does not use %s as a photo and shows the initials',
    (avatarUrl) => {
      const { container } = render(<AccountBadge user={{ ...ana, avatarUrl }} {...actions()} />);

      expect(container.querySelector('img')).toBeNull();
      expect(screen.getByText('AP')).toBeTruthy();
    },
  );

  it('falls back to the initials when the photo does not load', () => {
    const { container } = render(<AccountBadge user={ana} {...actions()} />);

    fireEvent.error(container.querySelector('img')!);

    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('AP')).toBeTruthy();
  });

  it('shows the role "Administrador" for an administrator', () => {
    render(
      <AccountBadge
        user={{ ...ana, roles: ['administrador', 'colaborador', 'usuario'] }}
        {...actions()}
      />,
    );
    expect(screen.getByText('Administrador')).toBeTruthy();
  });

  it('signs out from the menu', () => {
    const { onSignOut, onSignIn } = actions();
    render(<AccountBadge user={ana} onSignOut={onSignOut} onSignIn={onSignIn} />);

    fireEvent.click(screen.getByRole('button', { name: /Ana Pérez/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Cerrar sesión' }));

    expect(onSignOut).toHaveBeenCalledOnce();
    expect(onSignIn).not.toHaveBeenCalled();
  });
});

describe('AccountBadge, guest', () => {
  it('offers only "Ingresar" and goes to the entry from it', () => {
    const { onSignOut, onSignIn } = actions();
    render(<AccountBadge user={null} onSignOut={onSignOut} onSignIn={onSignIn} />);

    expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(onSignIn).toHaveBeenCalledOnce();
    expect(onSignOut).not.toHaveBeenCalled();
  });
});
