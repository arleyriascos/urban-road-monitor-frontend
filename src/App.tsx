import { useEffect } from 'react';
import { wakeAiService } from './api/ai-service';
import { EntryScreen } from './components/EntryScreen';
import { MapApp } from './components/MapApp';
import { PrivacyPage } from './components/PrivacyPage';
import { SessionCheckScreen } from './components/SessionCheckScreen';
import { googleClientId } from './config/env';
import { useSession } from './hooks/useSession';

/** The address of the privacy page. The host rewrites every path to the app, so no router is needed. */
export const PRIVACY_PATH = '/privacidad';

function isPrivacyPath(pathname: string): boolean {
  return pathname.replace(/\/+$/, '') === PRIVACY_PATH;
}

/** The whole app: the privacy page, or else the entry, the check of a saved session, or the map. */
export function App() {
  // The privacy page is public and needs no session, so it does not even start one.
  if (isPrivacyPath(window.location.pathname)) return <PrivacyPage />;
  return <SessionApp />;
}

function SessionApp() {
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
            <a href={PRIVACY_PATH}>Política de privacidad</a>
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
