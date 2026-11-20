import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/http';
import { LanguageProvider } from '../i18n/LanguageProvider';
import type { AccountProfile } from '../types/auth';
import { PasswordSettings } from './PasswordSettings';

afterEach(() => window.localStorage.clear());

const profile = (hasPassword: boolean): AccountProfile => ({
  id: 'u1',
  email: 'ana@example.com',
  fullName: 'Ana',
  avatarUrl: null,
  roles: ['usuario'],
  permissions: [],
  hasPassword,
  emailVerified: true,
});

type Fetch = NonNullable<Parameters<typeof PasswordSettings>[0]['fetchProfile']>;
const show = (fetchProfile: Fetch) =>
  render(
    <LanguageProvider>
      <PasswordSettings token="t" fetchProfile={fetchProfile} />
    </LanguageProvider>,
  );

describe('PasswordSettings', () => {
  it('shows the form when the account has a password', async () => {
    const fetchProfile = vi.fn<Fetch>(() => Promise.resolve(profile(true)));
    show(fetchProfile);

    await screen.findByRole('heading', { level: 2, name: 'Contraseña' });
    expect(screen.getByLabelText('Contraseña actual')).toBeTruthy();
    expect(fetchProfile.mock.calls[0][0]).toBe('t');
  });

  it('shows nothing for a Google account', async () => {
    const fetchProfile = vi.fn<Fetch>(() => Promise.resolve(profile(false)));
    show(fetchProfile);

    await waitFor(() => expect(fetchProfile).toHaveBeenCalled());
    expect(screen.queryByLabelText('Contraseña actual')).toBeNull();
  });

  it('shows nothing when the profile cannot be read', async () => {
    const fetchProfile = vi.fn<Fetch>(() => Promise.reject(new ApiError('network', 'x')));
    show(fetchProfile);

    await waitFor(() => expect(fetchProfile).toHaveBeenCalled());
    expect(screen.queryByLabelText('Contraseña actual')).toBeNull();
  });
});
