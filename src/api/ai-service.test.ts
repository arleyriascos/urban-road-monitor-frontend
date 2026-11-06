import { describe, expect, it, vi } from 'vitest';
import { WAKE_INTERVAL_MS, createAiServiceWaker } from './ai-service';

describe('createAiServiceWaker', () => {
  it('asks the public /health without waiting and without reading the answer', () => {
    const fetch = vi.fn(() => new Promise(() => {}));
    const wake = createAiServiceWaker({ url: 'https://ai.example.com', fetch });

    expect(wake()).toBe(true);

    expect(fetch).toHaveBeenCalledWith('https://ai.example.com/health', {
      mode: 'no-cors',
      cache: 'no-store',
    });
  });

  it('does nothing when the address is not configured', () => {
    const fetch = vi.fn(async () => undefined);
    const wake = createAiServiceWaker({ url: null, fetch });

    expect(wake()).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('asks at most once every 20 seconds', () => {
    let now = 0;
    const fetch = vi.fn(async () => undefined);
    const wake = createAiServiceWaker({ url: 'https://ai.example.com', fetch, now: () => now });

    wake();
    now += WAKE_INTERVAL_MS - 1;
    expect(wake()).toBe(false);
    now += 1;
    expect(wake()).toBe(true);

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('ignores a failed request', async () => {
    const fetch = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    });
    const wake = createAiServiceWaker({ url: 'https://ai.example.com', fetch });

    expect(() => wake()).not.toThrow();
    await Promise.resolve();
  });
});
