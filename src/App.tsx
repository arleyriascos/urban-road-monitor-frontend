import { useEffect } from 'react';
import { wakeAiService } from './api/ai-service';
import { EntryScreen } from './components/EntryScreen';
import { MapApp } from './components/MapApp';
import { SessionCheckScreen } from './components/SessionCheckScreen';
import { googleClientId } from './config/env';
import { useSession } from './hooks/useSession';

/** The whole app: the entry, the check of a saved session, or the map. */
export function App() {
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
