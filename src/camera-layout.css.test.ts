import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(process.cwd(), 'src', 'camera.css'), 'utf8');

describe('the camera screen on a phone', () => {
  it('gives the video the height of the screen, not a short 16:9 strip', () => {
    const phone = css.slice(css.indexOf('@media (max-width: 860px) {'));
    const stage = phone.match(/\.camera__stage\s*{([^}]*)}/)?.[1] ?? '';
    expect(stage).toMatch(/aspect-ratio:\s*auto/);
    expect(stage).toMatch(/height:\s*calc\(100dvh - \d+px\)/);
  });

  it('puts the controls beside the video when the phone is on its side', () => {
    const landscape = css.slice(css.indexOf('(orientation: landscape)'));
    expect(landscape).toMatch(/grid-template-columns:\s*minmax\(0, 1fr\) 300px/);
    expect(landscape).toMatch(/\.camera__stage\s*{[^}]*height:\s*calc\(100dvh - 60px\)/);
  });
});
