import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { LanguageProvider } from './i18n/LanguageProvider';
import './styles.css';
import './map.css';
import './popups.css';
import './entry.css';
import './account.css';
import './privacy.css';
import './camera.css';
import './language.css';

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
