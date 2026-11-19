import { useEffect } from 'react';
import { wakeAiService } from './api/ai-service';
import { AccountApp } from './components/AccountApp';
import { CAMERA_PATH, CameraPage } from './components/CameraPage';
import { EntryScreen } from './components/EntryScreen';
import { MapApp } from './components/MapApp';
import { PRIVACY_PATH, PrivacyPage } from './components/PrivacyPage';
import { SessionCheckScreen } from './components/SessionCheckScreen';
import { googleClientId } from './config/env';
import { useSession } from './hooks/useSession';
import { useLanguage } from './i18n/useLanguage';
import { sectionFromPath } from './lib/account-sections';

function isPath(pathname: string, path: string): boolean {
  return pathname.replace(/\/+$/, '') === path;
}

/**
 * The whole app: the privacy page, the camera, the account page, or else the entry, the check of
 * a saved session, or the map.
 */
export function App() {
  // The privacy page is public and needs no session, so it does not even start one.
  if (isPath(window.location.pathname, PRIVACY_PATH)) return <PrivacyPage />;
  // The camera only shows the boxes on the device for now: it needs no session either.
  if (isPath(window.location.pathname, CAMERA_PATH)) return <CameraPage />;
  // The account page has its own session check: it does not need the map.
  const section = sectionFromPath(window.location.pathname);
  if (section) return <AccountApp section={section} />;
  return <SessionApp />;
}

function SessionApp() {
  const { t } = useLanguage();
  // The AI service sleeps on Render and only a browser can wake it: start now, while the
  // person chooses how to enter and the map loads, so it is usually awake by then.
  useEffect(() => {
    wakeAiService();
  }, []);

  const session = useSession();
  const { state } = session;

  if (state.status === 'checking') {
    return (
      <SessionCheckScreen
        unreachable={state.unreachable}
        onRetry={session.retryCheck}
        onSkip={session.skipCheck}
      />
    );
  }

  if (state.status === 'entry') {
    return (
      <EntryScreen
        signIn={state.signIn}
        googleClientId={googleClientId}
        onCredential={session.signInWithCredential}
        onGuest={session.continueAsGuest}
        footer={
          <p className="entry__note">
            <a href={PRIVACY_PATH}>{t('entry.privacyLink')}</a>
          </p>
        }
      />
    );
  }

  return (
    <MapApp
      account={{
        user: state.status === 'signed_in' ? state.user : null,
        onSignOut: session.signOut,
        onSignIn: session.requestSignIn,
      }}
    />
  );
}
