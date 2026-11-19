import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { LanguageProvider } from './i18n/LanguageProvider';
import { applyTheme } from './theme/theme';
import { themeStore } from './theme/theme-store';
import './styles.css';
import './map.css';
import './popups.css';
import './entry.css';
import './account.css';
import './privacy.css';
import './camera.css';
import './language.css';
import './auth-form.css';

// The theme the person chose goes on before the first paint, so the page never flashes the other one.
applyTheme(themeStore.read());

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root was not found in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
);
