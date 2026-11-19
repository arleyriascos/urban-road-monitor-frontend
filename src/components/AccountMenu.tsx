import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { useLanguage } from '../i18n/useLanguage';
import { ACCOUNT_PATHS, type AccountSection } from '../lib/account-sections';
import { describeRole } from '../lib/person';
import type { AuthUser } from '../types/auth';
import { Avatar } from './Avatar';
import { Icon, type IconName } from './Icon';

const ITEMS: { section: AccountSection; icon: IconName }[] = [
  { section: 'profile', icon: 'user' },
  { section: 'trips', icon: 'route' },
  { section: 'settings', icon: 'settings' },
];

/**
 * What the signed-in person sees in the top bar: their photo and name, which open a menu with
 * their profile, their trips, the settings (each one a link to its part of the account page) and
 * the way to sign out. It is a menu in the sense of
 * the keyboard too: the arrows, Home and End move between the items, Escape closes it and gives
 * the focus back to the button, and so does a click or a Tab outside.
 */
export function AccountMenu({ user, onSignOut }: { user: AuthUser; onSignOut: () => void }) {
  const { t, locale } = useLanguage();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const items = () =>
    Array.from(root.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);

  // The first item takes the keyboard when the menu opens.
  useEffect(() => {
    if (open) items()[0]?.focus();
  }, [open]);

  // A click anywhere else closes it.
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  const closeAndFocusButton = () => {
    setOpen(false);
    trigger.current?.focus();
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const all = items();
    const at = all.indexOf(document.activeElement as HTMLElement);
    const go = (index: number) => {
      event.preventDefault();
      all[(index + all.length) % all.length]?.focus();
    };
    if (event.key === 'ArrowDown') go(at + 1);
    else if (event.key === 'ArrowUp') go(at - 1);
    else if (event.key === 'Home') go(0);
    else if (event.key === 'End') go(all.length - 1);
    else if (event.key === 'Escape') {
      event.preventDefault();
      closeAndFocusButton();
    } else if (event.key === 'Tab') setOpen(false);
  };

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' && !open) {
      event.preventDefault();
      setOpen(true);
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div className="account account-menu" ref={root}>
      <button
        ref={trigger}
        type="button"
        className="account__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={onTriggerKeyDown}
      >
        <Avatar user={user} />
        <span className="account__who" title={user.email}>
          <span className="account__name">{user.fullName}</span>
          <span className="account__role">{describeRole(user.roles, locale)}</span>
        </span>
        <Icon name="chevronDown" />
      </button>

      {open && (
        <div className="account-menu__popup">
          <div className="account-menu__header">
            <span className="account-menu__name">{user.fullName}</span>
            <span className="account-menu__email">{user.email}</span>
          </div>
          <div
            id={menuId}
            role="menu"
            aria-label={t('account.menu.label')}
            className="account-menu__list"
            onKeyDown={onMenuKeyDown}
          >
            {ITEMS.map(({ section, icon }) => (
              <a
                key={section}
                role="menuitem"
                className="account-menu__item"
                href={ACCOUNT_PATHS[section]}
              >
                <Icon name={icon} />
                {t(`account.menu.${section}`)}
              </a>
            ))}
            <div role="separator" className="account-menu__separator" />
            <button
              type="button"
              role="menuitem"
              className="account-menu__item account-menu__item--sign-out"
              onClick={() => {
                setOpen(false);
                onSignOut();
              }}
            >
              <Icon name="logOut" />
              {t('account.menu.signOut')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
