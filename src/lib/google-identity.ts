export const GOOGLE_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

/** What Google sends when the person finishes: the ID token the backend will verify. */
export interface GoogleCredentialResponse {
  credential: string;
}

export interface GoogleButtonOptions {
  type: 'standard';
  theme: 'outline' | 'filled_blue' | 'filled_black';
  size: 'large' | 'medium' | 'small';
  text: 'signin_with' | 'continue_with';
  shape: 'rectangular' | 'pill';
  locale: string;
  width?: number;
}

/** The small part of Google Identity Services that this app uses. */
export interface GoogleIdApi {
  initialize(config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    use_fedcm_for_button?: boolean;
  }): void;
  renderButton(parent: HTMLElement, options: GoogleButtonOptions): void;
}

interface GoogleWindow {
  google?: { accounts?: { id?: GoogleIdApi } };
}

export interface GoogleLoaderOptions {
  /** Where the script is added and where it is looked for. */
  document?: Document;
  /** Where Google puts its API once the script runs. */
  host?: GoogleWindow;
  /** How long to wait for the script before giving up. */
  timeoutMs?: number;
}

/**
 * Loads Google's sign-in script the first time it is needed, not before: a person who goes
 * on as a guest never talks to Google. Asking again while it loads (or after it loaded) gives
 * the same answer; after a failure the next ask tries again.
 */
export function createGoogleIdentityLoader({
  document: doc = document,
  host = window as unknown as GoogleWindow,
  timeoutMs = 15_000,
}: GoogleLoaderOptions = {}): () => Promise<GoogleIdApi> {
  let pending: Promise<GoogleIdApi> | null = null;

  const api = () => host.google?.accounts?.id;

  return function load() {
    const ready = api();
    if (ready) return Promise.resolve(ready);
    if (pending) return pending;

    pending = new Promise<GoogleIdApi>((resolve, reject) => {
      let script = doc.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_SCRIPT_URL}"]`);
      const timer = setTimeout(() => fail(new Error('Google took too long to answer')), timeoutMs);

      function fail(error: Error) {
        clearTimeout(timer);
        script?.remove(); // A new try starts from a clean script.
        pending = null;
        reject(error);
      }

      function succeed() {
        const loaded = api();
        if (!loaded) return fail(new Error('Google answered, but without its sign-in'));
        clearTimeout(timer);
        resolve(loaded);
      }

      if (!script) {
        script = doc.createElement('script');
        script.src = GOOGLE_SCRIPT_URL;
        script.async = true;
        script.defer = true;
        doc.head.append(script);
      }
      script.addEventListener('load', succeed, { once: true });
      script.addEventListener('error', () => fail(new Error('Google could not be reached')), {
        once: true,
      });
    });
    return pending;
  };
}

/** The loader of the app. */
export const loadGoogleIdentity = createGoogleIdentityLoader();
