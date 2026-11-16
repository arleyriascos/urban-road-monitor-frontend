import type { DeviceInfo } from '../types/trips';

/** Up to 100 characters, as the server accepts. */
const MAX_TEXT = 100;

function platformOf(userAgent: string): DeviceInfo['platform'] {
  if (/android/i.test(userAgent)) return 'android';
  // An iPad can say it is a Mac; the touch screen tells them apart (see `describeDevice`).
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'ios';
  return 'other';
}

/** "Chrome 142", "Safari 18", "Firefox 130"… or null when the browser is not one we know. */
export function browserOf(userAgent: string): string | null {
  const rules: [string, RegExp][] = [
    ['Edge', /(?:Edg|EdgA|EdgiOS)\/(\d+)/],
    ['Opera', /(?:OPR|OPiOS)\/(\d+)/],
    ['Samsung Internet', /SamsungBrowser\/(\d+)/],
    ['Firefox', /(?:Firefox|FxiOS)\/(\d+)/],
    ['Chrome', /(?:Chrome|CriOS)\/(\d+)/],
    ['Safari', /Version\/(\d+)[\d.]*.*Safari/],
  ];
  for (const [name, pattern] of rules) {
    const found = pattern.exec(userAgent);
    if (found) return `${name} ${found[1]}`;
  }
  return null;
}

/**
 * What the server keeps to recognize the phone: the system and the browser. The same person
 * with the same phone and browser is the same device on every trip. No name is sent.
 */
export function describeDevice(userAgent: string, maxTouchPoints = 0): DeviceInfo {
  let platform = platformOf(userAgent);
  if (platform === 'other' && /Macintosh/.test(userAgent) && maxTouchPoints > 1) platform = 'ios';
  const browser = browserOf(userAgent);
  return browser ? { platform, browser: browser.slice(0, MAX_TEXT) } : { platform };
}

/** The device of this browser. */
export function currentDevice(): DeviceInfo {
  if (typeof navigator === 'undefined') return { platform: 'other' };
  return describeDevice(navigator.userAgent, navigator.maxTouchPoints);
}
