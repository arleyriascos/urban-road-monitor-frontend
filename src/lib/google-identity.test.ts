import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGoogleIdentityLoader, GOOGLE_SCRIPT_URL, type GoogleIdApi } from './google-identity';

const fakeApi = (): GoogleIdApi => ({ initialize: vi.fn(), renderButton: vi.fn() });

function setup(timeoutMs?: number) {
  const host: { google?: { accounts?: { id?: GoogleIdApi } } } = {};
  const load = createGoogleIdentityLoader({ document, host, timeoutMs });
  const scripts = () =>
    document.querySelectorAll<HTMLScriptElement>(`script[src="${GOOGLE_SCRIPT_URL}"]`);
  return { host, load, scripts };
}

afterEach(() => {
  document.head.querySelectorAll('script').forEach((script) => script.remove());
  vi.useRealTimers();
});

describe('the Google script loader', () => {
  it('adds the script only when asked and resolves with the API when it loads', async () => {
    const { host, load, scripts } = setup();
    expect(scripts()).toHaveLength(0);

    const answer = load();
    expect(scripts()).toHaveLength(1);
    expect(scripts()[0]!.async).toBe(true);

    const api = fakeApi();
    host.google = { accounts: { id: api } };
    scripts()[0]!.dispatchEvent(new Event('load'));

    await expect(answer).resolves.toBe(api);
  });

  it('adds the script once however many times it is asked while loading', async () => {
    const { host, load, scripts } = setup();

    const first = load();
    const second = load();
    expect(second).toBe(first);
    expect(scripts()).toHaveLength(1);

    host.google = { accounts: { id: fakeApi() } };
    scripts()[0]!.dispatchEvent(new Event('load'));
    await first;
  });

  it('answers at once, without a new script, when the API is already there', async () => {
    const { host, load, scripts } = setup();
    const api = fakeApi();
    host.google = { accounts: { id: api } };

    await expect(load()).resolves.toBe(api);
    expect(scripts()).toHaveLength(0);
  });

  it('fails when the script cannot be loaded, and the next ask starts again', async () => {
    const { host, load, scripts } = setup();

    const failed = load();
    scripts()[0]!.dispatchEvent(new Event('error'));
    await expect(failed).rejects.toThrow('Google could not be reached');
    expect(scripts()).toHaveLength(0);

    const again = load();
    expect(scripts()).toHaveLength(1);
    const api = fakeApi();
    host.google = { accounts: { id: api } };
    scripts()[0]!.dispatchEvent(new Event('load'));
    await expect(again).resolves.toBe(api);
  });

  it('fails when the script loads but Google gave no sign-in', async () => {
    const { load, scripts } = setup();

    const answer = load();
    scripts()[0]!.dispatchEvent(new Event('load'));

    await expect(answer).rejects.toThrow('without its sign-in');
  });

  it('gives up when Google takes too long', async () => {
    vi.useFakeTimers();
    const { load } = setup(5_000);

    const answer = load();
    const assertion = expect(answer).rejects.toThrow('too long');
    await vi.advanceTimersByTimeAsync(5_000);

    await assertion;
  });
});
