import type { KeyboardEvent } from 'react';
import { useLanguage } from '../i18n/useLanguage';
import { ACCESS_PANEL_ID, accessTabId } from '../lib/access-ids';
import type { AccessView } from '../lib/email-auth';

const TABS = ['login', 'register'] as const;

interface AccessTabsProps {
  view: AccessView;
  onChange: (view: AccessView) => void;
}

/**
 * "Iniciar sesión | Crear cuenta". Recovering the password belongs to signing in, so while that
 * form is open the first tab is still the chosen one. With the keyboard, the arrows move
 * between the tabs (and Home and End go to the first and the last), as in any set of tabs.
 */
export function AccessTabs({ view, onChange }: AccessTabsProps) {
  const { t } = useLanguage();
  const chosen = view === 'register' ? 'register' : 'login';

  const move = (event: KeyboardEvent<HTMLButtonElement>) => {
    const index = TABS.indexOf(chosen);
    let next: number | null = null;
    if (event.key === 'ArrowRight') next = (index + 1) % TABS.length;
    if (event.key === 'ArrowLeft') next = (index + TABS.length - 1) % TABS.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = TABS.length - 1;
    if (next === null) return;
    event.preventDefault();
    const tab = TABS[next]!;
    onChange(tab);
    document.getElementById(accessTabId(tab))?.focus();
  };

  return (
    <div className="entry-tabs" role="tablist" aria-label={t('entry.tabs.label')}>
      {TABS.map((tab) => (
        <button
          key={tab}
          id={accessTabId(tab)}
          type="button"
          role="tab"
          className="entry-tabs__tab"
          aria-selected={chosen === tab}
          aria-controls={ACCESS_PANEL_ID}
          tabIndex={chosen === tab ? 0 : -1}
          onClick={() => onChange(tab)}
          onKeyDown={move}
        >
          {t(`entry.tab.${tab}`)}
        </button>
      ))}
    </div>
  );
}
