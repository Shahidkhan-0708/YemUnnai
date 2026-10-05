import React, { useEffect, useRef, useState } from 'react';
import { Download, Share2, X, Smartphone } from 'lucide-react';
import { createPortal } from 'react-dom';
import { CatalogImage } from './CatalogImage';
import { useModalA11y } from '../lib/useModalA11y';
import { useLanguage } from '../lib/language';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    __yemDeferredInstall?: BeforeInstallPromptEvent;
  }
}

const DISMISS_KEY = 'yem-install-dismissed';

const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true);

/**
 * Install YEMUNNAI as an app — centered modal:
 *  - Chrome/Android: captures `beforeinstallprompt` and shows the native install flow.
 *  - iOS Safari: shows the "Add to Home Screen" instructions instead.
 *  - Offers installation after the intro or successful login, once per session.
 */
export const InstallPrompt: React.FC<{ autoOffer?: boolean }> = ({ autoOffer = false }) => {
  const { t } = useLanguage();
  const [loginRequest, setLoginRequest] = useState(0);
  const [requested, setRequested] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installError, setInstallError] = useState('');
  const installLock = useRef(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOS, setShowIOS] = useState(false);
  const [installed, setInstalled] = useState(isStandalone);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    if (isStandalone()) return true;
    try { return sessionStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
  });

  useEffect(() => {
    const onPromptAvailable = () => {
      if (window.__yemDeferredInstall) setDeferred(window.__yemDeferredInstall);
    };

    // Catch events that fired before this component mounted.
    onPromptAvailable();
    window.addEventListener('yem-install-available', onPromptAvailable);
    const onLogin = () => setLoginRequest(value => value + 1);
    window.addEventListener('yem-login-success', onLogin);
    const displayMode = window.matchMedia('(display-mode: standalone)');
    const onInstalled = () => { setInstalled(true); setRequested(false); window.__yemDeferredInstall = undefined; };
    const onDisplayMode = () => { if (isStandalone()) onInstalled(); };
    window.addEventListener('appinstalled', onInstalled);
    displayMode.addEventListener('change', onDisplayMode);

    const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent) || (/Macintosh/i.test(window.navigator.userAgent) && navigator.maxTouchPoints > 1);
    if (isIOS && !isStandalone()) setShowIOS(true);

    return () => {
      window.removeEventListener('yem-install-available', onPromptAvailable);
      window.removeEventListener('yem-login-success', onLogin);
      window.removeEventListener('appinstalled', onInstalled);
      displayMode.removeEventListener('change', onDisplayMode);
    };
  }, []);

  const available = !installed && (!!deferred || showIOS);
  useEffect(() => {
    if ((!autoOffer && !loginRequest) || dismissed || !available) return;
    // A delayed browser offer is still eligible. Wait until login or another sheet closes.
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      clearTimeout(timer);
      if (document.querySelector('[role="dialog"]')) return;
      timer = setTimeout(() => {
        if (!document.querySelector('[role="dialog"]')) setRequested(true);
      }, 450);
    };
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    schedule();
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, [autoOffer, loginRequest, dismissed, available]);
  const open = requested && available;
  const close = () => {
    if (installLock.current) return;
    setRequested(false);
    setDismissed(true);
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch { /* Storage can be disabled. */ }
  };
  const sheetRef = useModalA11y<HTMLDivElement>(open, close);

  if (!available) return null;
  if (!open) return <div className="app-install-entry"><button type="button" className="app-install-button" onClick={() => setRequested(true)}><Smartphone size={17} aria-hidden="true"/>{t('Install app', 'యాప్ ఇన్‌స్టాల్ చేయండి')}</button></div>;

  const install = async () => {
    if (!deferred || installLock.current) return;
    installLock.current = true; setInstalling(true); setInstallError('');
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      setDeferred(null); window.__yemDeferredInstall = undefined;
      setRequested(false); setDismissed(true);
      try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch { /* Storage can be disabled. */ }
      if (choice.outcome === 'accepted') setInstalled(true);
    } catch { setInstallError(t('Installation could not start. Please try again.', 'ఇన్‌స్టాల్ చేయలేకపోయాం. మళ్లీ ప్రయత్నించండి.')); }
    finally { installLock.current = false; setInstalling(false); }
  };

  return createPortal(
    <div className="install-overlay fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
      {/* Dimmed backdrop — tap to dismiss */}
      <div
        className="absolute inset-0"
        onClick={close}
        aria-hidden="true"
      />

      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('Install YEMUNNAI', 'YEMUNNAI ఇన్‌స్టాల్ చేయండి')}
        className="install-sheet relative w-full max-w-sm rounded-3xl bg-[#FFFCF8] border border-[#E7DED5] shadow-2xl p-6 text-center text-[#1F140A]"
      >
        {/* Close */}
        <button
          type="button"
          onClick={close}
          disabled={installing}
          aria-label={t('Dismiss install prompt', 'ఇన్‌స్టాల్ సూచన మూసివేయండి')}
          className="absolute top-3 right-3 min-w-11 min-h-11 flex items-center justify-center rounded-full bg-white/10"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>

        {/* App icon — logo fills the tile completely */}
        <div className="mx-auto w-16 h-16 rounded-[20px] overflow-hidden shadow-lg">
          <CatalogImage src="/images/NewLogo.svg" priority alt="YEMUNNAI" className="w-full h-full object-cover" />
        </div>

        <h2 className="mt-3.5 text-xl font-bold">{t('Install YEMUNNAI', 'YEMUNNAI ఇన్‌స్టాల్ చేయండి')}</h2>
        {installError && <p role="alert" className="pickup-error mt-3">{installError}</p>}

        {deferred ? (
          <>
            <p className="text-xs text-[#7A6658] leading-relaxed mt-3">
              {t('Keep the campus menu on your home screen. Live menus and orders need a connection.', 'క్యాంపస్ మెనూను మీ హోమ్ స్క్రీన్‌లో ఉంచుకోండి. తాజా మెనూలు మరియు ఆర్డర్ల కోసం ఇంటర్నెట్ అవసరం.')}
            </p>
            <button
              type="button"
              onClick={install}
              disabled={installing}
              className="mt-4 w-full min-h-11 rounded-2xl bg-[#F26A00] text-white font-bold flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              <span>{installing ? t('Opening installer…', 'ఇన్‌స్టాలర్ తెరుస్తున్నాం…') : t('Install app', 'యాప్ ఇన్‌స్టాల్ చేయండి')}</span>
            </button>
            <button
              type="button"
              onClick={close}
              disabled={installing}
              className="mt-2 min-h-11 text-xs text-[#7A6658] underline"
            >
              {t('Not now', 'ఇప్పుడు వద్దు')}
            </button>
          </>
        ) : (
          <>
            <p className="text-xs text-[#7A6658] leading-relaxed mt-3 flex items-start justify-center gap-2">
              <Share2 className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              {t('Tap the Share icon in Safari, then choose “Add to Home Screen”.', 'Safariలో షేర్ గుర్తును నొక్కి, “Add to Home Screen” ఎంచుకోండి.')}
            </p>
            <button
              type="button"
              onClick={close}
              className="mt-4 w-full min-h-11 rounded-2xl bg-[#F26A00] text-white font-bold flex items-center justify-center gap-2"
            >
              {t('Back to menu', 'మెనూకి తిరిగి వెళ్ళండి')}
            </button>
          </>
        )}
      </div>
    </div>
  , document.body);
};
