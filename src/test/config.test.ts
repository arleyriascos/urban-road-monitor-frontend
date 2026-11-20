import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getConfig } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';

const config = readFileSync(resolve(process.cwd(), 'vitest.config.ts'), 'utf8');

describe('the limits of the tests', () => {
  it('gives each test and each hook 30 seconds, for a computer that is busy', () => {
    expect(config).toMatch(/testTimeout:\s*30_000/);
    expect(config).toMatch(/hookTimeout:\s*30_000/);
  });

  it('runs the files on half of the processors, so the computer is not left without room', () => {
    expect(config).toMatch(/maxWorkers:\s*'50%'/);
  });

  it('makes Testing Library wait up to 8 seconds for something to appear', () => {
    expect(getConfig().asyncUtilTimeout).toBe(8000);
  });
});
