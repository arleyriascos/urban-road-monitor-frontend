import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';

// Testing Library only cleans up by itself when test globals are enabled.
afterEach(() => {
  cleanup();
});

// Testing Library waits one second for something to appear. On a busy computer that is too little.
configure({ asyncUtilTimeout: 8000 });
