import { describe, expect, it } from 'vitest';
import { browserOf, describeDevice } from './device';

const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36';
const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
const IPHONE_CHROME =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/142.0.0.0 Mobile/15E148 Safari/604.1';
const SAMSUNG =
  'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36';
const FIREFOX_ANDROID = 'Mozilla/5.0 (Android 14; Mobile; rv:130.0) Gecko/130.0 Firefox/130.0';
const EDGE =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0';
const IPAD_AS_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15';

describe('describeDevice', () => {
  it('recognizes an Android phone with Chrome', () => {
    expect(describeDevice(ANDROID_CHROME)).toEqual({ platform: 'android', browser: 'Chrome 142' });
  });

  it('recognizes an iPhone with Safari and with Chrome', () => {
    expect(describeDevice(IPHONE_SAFARI)).toEqual({ platform: 'ios', browser: 'Safari 18' });
    expect(describeDevice(IPHONE_CHROME)).toEqual({ platform: 'ios', browser: 'Chrome 142' });
  });

  it('takes an iPad that says it is a Mac for iOS, but a real Mac for other', () => {
    expect(describeDevice(IPAD_AS_MAC, 5).platform).toBe('ios');
    expect(describeDevice(IPAD_AS_MAC, 0).platform).toBe('other');
  });

  it('sends only the platform when the browser is not known', () => {
    expect(describeDevice('curl/8.0')).toEqual({ platform: 'other' });
  });
});

describe('browserOf', () => {
  it('tells apart the browsers that hide behind Chrome', () => {
    expect(browserOf(SAMSUNG)).toBe('Samsung Internet 26');
    expect(browserOf(EDGE)).toBe('Edge 142');
  });

  it('knows Firefox', () => {
    expect(browserOf(FIREFOX_ANDROID)).toBe('Firefox 130');
  });

  it('is null for what it does not know', () => {
    expect(browserOf('')).toBeNull();
  });
});
