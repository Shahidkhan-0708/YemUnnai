import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import type { BeforeInstallPromptEvent } from './components/InstallPrompt.tsx'
import { publicCatalog } from './lib/publicCatalog'

// Begin the shared catalog read while the intro and app are mounting.
if (import.meta.env.PROD && !new URLSearchParams(location.search).has('portal')) void publicCatalog().catch(() => {});

// PWA: capture the install prompt as early as possible so the in-app install sheet can use it.
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  window.__yemDeferredInstall = event as BeforeInstallPromptEvent;
  window.dispatchEvent(new Event('yem-install-available'));
});

// PWA: register the service worker (production only) so the app installs and works offline.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
