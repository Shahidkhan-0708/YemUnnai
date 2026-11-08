import { SvgScreenFrame } from './SvgScreenFrame';
import { createPortal } from 'react-dom';
import { CatalogImage } from './CatalogImage';
import { useEffect, useRef, useState } from 'react';
import { X, AlertCircle, Delete, Store, ShieldCheck, ArrowRight, RotateCcw } from 'lucide-react';
import { useVendorSession, useShops } from '../lib/hooks';
import { useModalA11y } from '../lib/useModalA11y';
import { useLanguage } from '../lib/language';
import { VENDOR_OUTLETS, lookupOutletByStoreCode } from '../lib/vendorAuth';
import { playTapSound } from '../lib/celebration';
import { reportAppError } from '../lib/telemetry';

// Device-level velocity throttling constants
const MAX_FAILED_ATTEMPTS = 5;
const SLIDING_WINDOW_MS = 60 * 1000;
const LOCKOUT_DURATION_MS = 120 * 1000;

let failedAttemptTimestamps: number[] = [];
let terminalLockoutUntil = 0;

function recordFailedAttempt(): number {
  const nowMs = Date.now();
  failedAttemptTimestamps = failedAttemptTimestamps.filter(t => nowMs - t < SLIDING_WINDOW_MS);
  failedAttemptTimestamps.push(nowMs);

  if (failedAttemptTimestamps.length >= MAX_FAILED_ATTEMPTS) {
    terminalLockoutUntil = nowMs + LOCKOUT_DURATION_MS;
    reportAppError('auth', 'Device-level terminal velocity throttle triggered: 5 failed attempts in 60s');
  }
  return terminalLockoutUntil;
}

function resetFailedAttempts() {
  failedAttemptTimestamps = [];
  terminalLockoutUntil = 0;
}

interface VendorLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignedIn?: () => void;
}

export function VendorLoginModal({ isOpen, onClose, onSignedIn }: VendorLoginModalProps) {
  const { t } = useLanguage();
  const { signInWithOutlet } = useVendorSession();
  const { shops, loading: shopsLoading } = useShops();
  const outlets = shops.length ? shops : shopsLoading ? VENDOR_OUTLETS : [];

  // Step 1: Store Code Lookup
  const [storeCode, setStoreCode] = useState('');
  const [matchedOutlet, setMatchedOutlet] = useState<{ id: string; name: string; code: string } | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  // Step 2: PIN Deck
  const [pin, setPin] = useState(['', '', '', '']);
  const pinInputRefs = [
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
  ];

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [retryAt, setRetryAt] = useState<Record<string, number>>({});
  const [now, setNow] = useState(() => Date.now());
  const inFlight = useRef(false);
  const generation = useRef(0);
  const rootRef = useModalA11y<HTMLDivElement>(isOpen, () => { if (!inFlight.current) onClose(); });

  const currentOutletId = matchedOutlet?.id ?? '';
  const outletRetrySeconds = Math.max(0, Math.ceil(((retryAt[currentOutletId] ?? 0) - now) / 1000));
  const deviceLockSeconds = Math.max(0, Math.ceil((terminalLockoutUntil - now) / 1000));
  const activeLockoutSeconds = Math.max(outletRetrySeconds, deviceLockSeconds);
  const disabled = busy || activeLockoutSeconds > 0;

  // Reset state on open/close
  useEffect(() => {
    generation.current++;
    setStoreCode('');
    setMatchedOutlet(null);
    setCodeError(null);
    setPin(['', '', '', '']);
    setError(null);
    if (!isOpen) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearInterval(timer); generation.current++; };
  }, [isOpen]);

  // Handle store code changes (Blind lookup: reveals nothing until matched)
  const handleStoreCodeChange = (raw: string) => {
    const clean = raw.toUpperCase().trim().replace(/[^A-Z0-9]/g, '');
    setStoreCode(clean);
    setCodeError(null);

    const match = lookupOutletByStoreCode(clean, outlets);
    if (match) {
      playTapSound();
      setMatchedOutlet(match);
      setPin(['', '', '', '']);
      setError(null);
      // Auto-focus first PIN input box after state flush
      setTimeout(() => {
        pinInputRefs[0].current?.focus();
      }, 80);
    }
  };

  const handleManualCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || !storeCode.trim()) return;
    const match = lookupOutletByStoreCode(storeCode, outlets);
    if (match) {
      setMatchedOutlet(match);
      setTimeout(() => pinInputRefs[0].current?.focus(), 80);
    } else {
      recordFailedAttempt();
      setCodeError(t('Invalid terminal shortcode. Please check with campus manager.', 'చెల్లని టెర్మినల్ కోడ్. దయచేసి నిర్వాహకుడిని సంప్రదించండి.'));
    }
  };

  const attemptPinSubmit = async (pinDigits: string[]) => {
    const fullPin = pinDigits.join('');
    if (!matchedOutlet || inFlight.current || activeLockoutSeconds > 0 || !/^\d{4}$/.test(fullPin)) return;

    inFlight.current = true;
    setBusy(true);
    setError(null);
    const current = generation.current;

    try {
      const result = await signInWithOutlet(matchedOutlet.id, fullPin);
      if (current !== generation.current) return;
      if (result.ok) {
        resetFailedAttempts();
        onSignedIn?.();
        onClose();
        window.dispatchEvent(new Event('yem-login-success'));
      } else {
        recordFailedAttempt();
        setError(t(result.error ?? 'Incorrect security PIN. Please try again.', 'తప్పు భద్రతా PIN. మళ్లీ ప్రయత్నించండి.'));
        setPin(['', '', '', '']);
        pinInputRefs[0].current?.focus();
        if (result.retrySeconds) {
          const timestamp = Date.now();
          setNow(timestamp);
          setRetryAt(prev => ({ ...prev, [matchedOutlet.id]: timestamp + result.retrySeconds! * 1000 }));
        }
      }
    } catch {
      if (current === generation.current) {
        recordFailedAttempt();
        setError(t('Unable to connect to kitchen server. Please retry.', 'కనెక్షన్ లేదు. మళ్లీ ప్రయత్నించండి.'));
        setPin(['', '', '', '']);
        pinInputRefs[0].current?.focus();
      }
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  const handlePinCellChange = (index: number, val: string) => {
    if (inFlight.current || retrySeconds > 0) return;
    const digit = val.replace(/\D/g, '').slice(-1);
    const nextPin = [...pin];
    nextPin[index] = digit;
    setPin(nextPin);
    setError(null);

    // Auto-advance to next box
    if (digit && index < 3) {
      pinInputRefs[index + 1].current?.focus();
    }

    // Auto-submit on 4th digit
    if (digit && index === 3 && nextPin.every(d => d !== '')) {
      void attemptPinSubmit(nextPin);
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinInputRefs[index - 1].current?.focus();
    }
  };

  const handleKeypadPress = (key: string) => {
    if (inFlight.current || retrySeconds > 0) return;
    playTapSound();

    if (key === 'delete') {
      // Find last filled cell
      const lastFilledIndex = [...pin].reverse().findIndex(d => d !== '');
      if (lastFilledIndex !== -1) {
        const targetIndex = 3 - lastFilledIndex;
        const nextPin = [...pin];
        nextPin[targetIndex] = '';
        setPin(nextPin);
        pinInputRefs[targetIndex].current?.focus();
      }
      return;
    }

    // Find first empty cell
    const emptyIndex = pin.findIndex(d => d === '');
    if (emptyIndex !== -1) {
      const nextPin = [...pin];
      nextPin[emptyIndex] = key;
      setPin(nextPin);
      if (emptyIndex < 3) {
        pinInputRefs[emptyIndex + 1].current?.focus();
      }
      if (emptyIndex === 3 && nextPin.every(d => d !== '')) {
        void attemptPinSubmit(nextPin);
      }
    }
  };

  const handleSwitchAccount = () => {
    setMatchedOutlet(null);
    setStoreCode('');
    setCodeError(null);
    setPin(['', '', '', '']);
    setError(null);
  };

  if (!isOpen) return null;

  return createPortal(
    <SvgScreenFrame screen={null}>
      <div 
        ref={rootRef} 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="vendor-login-title"
        className="vendor-login fixed inset-0 z-50 overflow-y-auto bg-slate-900 text-white font-sans selection:bg-orange-500"
      >
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-between px-5 py-6 sm:py-8">
          
          {/* Top Bar */}
          <header className="flex items-center justify-between">
            <button 
              type="button" 
              onClick={onClose} 
              aria-label={t('Close login','ప్రవేశ విండో మూసివేయండి')} 
              disabled={busy}
              className="flex size-10 items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <X className="size-5" />
            </button>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>{t("Encrypted Partner Portal","రక్షిత వ్యాపార గేట్‌వే")}</span>
            </div>
          </header>

          {/* Central Security Core */}
          <div className="my-auto py-6">
            
            {/* Logo and Brand Title */}
            <div className="text-center mb-6">
              <CatalogImage 
                src="/images/NewLogo.svg" 
                size="thumbnail" 
                priority 
                alt="YEMUNNAI" 
                className="mx-auto size-16 rounded-2xl bg-[#F06A05] object-contain p-2 shadow-lg shadow-orange-500/20" 
              />
              <h2 id="vendor-login-title" className="mt-4 text-xl sm:text-2xl font-black text-white tracking-tight">
                {matchedOutlet ? matchedOutlet.name : 'Merchant Terminal'}
              </h2>
              <p className="mt-1 text-xs text-slate-400 font-normal">
                {matchedOutlet 
                  ? t('Enter 4-digit security PIN to unlock console', 'కన్సోల్ తెరవడానికి 4 అంకెల భద్రతా PIN నమోదు చేయండి') 
                  : t('Enter your unique store code to unlock kitchen console', 'మీ ప్రత్యేక స్టోర్ కోడ్ నమోదు చేయండి')}
              </p>
            </div>

            {/* STEP 1: BLIND STORE CODE ENTRY */}
            {!matchedOutlet ? (
              <form onSubmit={handleManualCodeSubmit} className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                {activeLockoutSeconds > 0 && (
                  <div role="alert" className="p-3.5 bg-rose-950/70 border border-rose-500/50 rounded-2xl text-center">
                    <p className="text-xs font-black text-rose-300">Terminal Security Lock Active</p>
                    <p className="text-[11px] text-rose-400 font-normal mt-0.5">
                      Too many failed attempts. Device locked for {Math.floor(activeLockoutSeconds / 60)}:{String(activeLockoutSeconds % 60).padStart(2, '0')}.
                    </p>
                  </div>
                )}

                <div className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700/60 shadow-xl backdrop-blur-xs">
                  <label htmlFor="store-code-input" className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2.5">
                    Terminal Store Code
                  </label>
                  <input 
                    id="store-code-input"
                    type="text"
                    autoFocus
                    autoCapitalize="characters"
                    autoComplete="off"
                    spellCheck="false"
                    maxLength={10}
                    disabled={disabled}
                    value={storeCode}
                    onChange={(e) => handleStoreCodeChange(e.target.value)}
                    placeholder="e.g. MITS, PARA, CAFE"
                    className="w-full bg-slate-950 border-2 border-slate-700 focus:border-orange-500 rounded-2xl px-4 py-3.5 text-center text-xl font-black tracking-widest uppercase text-orange-400 placeholder:text-slate-600 focus:outline-hidden transition-all shadow-inner disabled:opacity-40"
                  />

                  {codeError ? (
                    <p role="alert" className="flex items-center justify-center gap-1.5 text-xs text-rose-400 font-semibold mt-3">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{codeError}</span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 font-normal mt-3 text-center">
                      Type your 3–4 letter shop shortcode to unlock terminal
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={disabled || !storeCode.trim()}
                  className="w-full bg-orange-500 hover:bg-orange-600 active:scale-98 disabled:opacity-40 text-white text-xs font-black py-3.5 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Unlock Terminal</span>
                  <ArrowRight size={14} />
                </button>
              </form>
            ) : (
              /* STEP 2: VERIFIED OUTLET & 4-DIGIT PIN DECK */
              <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                
                {/* Verified Outlet Header */}
                <div className="flex items-center justify-between bg-slate-800/90 border border-emerald-500/40 rounded-2xl p-3 px-4 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                      <Store size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">{matchedOutlet.name}</h3>
                      <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Terminal Active ({matchedOutlet.code})
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSwitchAccount}
                    className="text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-white flex items-center gap-1 bg-slate-700/60 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <RotateCcw size={11} />
                    <span>Switch</span>
                  </button>
                </div>

                {/* 4-Box PIN Deck */}
                <div className="bg-slate-800/80 rounded-3xl p-5 sm:p-6 border border-slate-700/60 shadow-xl">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center mb-3">
                    Enter 4-Digit Security PIN
                  </label>
                  
                  <div className="flex justify-center gap-2.5 sm:gap-3 mb-2">
                    {pin.map((digit, idx) => (
                      <input 
                        key={idx}
                        ref={el => { pinInputRefs[idx].current = el; }}
                        type="password"
                        inputMode="numeric"
                        maxLength={1}
                        disabled={disabled}
                        value={digit}
                        onChange={(e) => handlePinCellChange(idx, e.target.value)}
                        onKeyDown={(e) => handlePinKeyDown(idx, e)}
                        className={`w-12 h-14 sm:w-14 sm:h-16 bg-slate-950 border-2 text-center text-2xl font-black text-white rounded-2xl focus:outline-hidden transition-all ${
                          digit ? 'border-emerald-500 text-emerald-400' : 'border-slate-700 focus:border-orange-500'
                        } disabled:opacity-40`}
                      />
                    ))}
                  </div>

                  {/* Feedback Message */}
                  <div className="mt-3 min-h-6 text-center text-xs" aria-live="polite">
                    {retrySeconds > 0 ? (
                      <p role="alert" className="text-rose-400 font-semibold">
                        Too many attempts. Try again in {Math.floor(retrySeconds / 60)}:{String(retrySeconds % 60).padStart(2, '0')}.
                      </p>
                    ) : error ? (
                      <p role="alert" className="flex items-center justify-center gap-1 text-rose-400 font-semibold">
                        <AlertCircle size={13} className="shrink-0" />
                        <span>{error}</span>
                      </p>
                    ) : (
                      <p className="text-slate-500 font-normal">
                        Sign-in confirms automatically upon 4th digit.
                      </p>
                    )}
                  </div>

                  {/* Onscreen Tactile Keypad */}
                  <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-2.5" aria-label="PIN keypad">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'].map(key => key === '' ? (
                      <span key="space" />
                    ) : (
                      <button 
                        key={key} 
                        type="button" 
                        disabled={disabled} 
                        aria-label={key === 'delete' ? 'Delete last digit' : key}
                        onClick={() => handleKeypadPress(key)}
                        className="flex h-11 sm:h-12 items-center justify-center rounded-xl bg-slate-900/90 hover:bg-slate-700/80 active:scale-95 text-lg font-black text-white border border-slate-700/50 transition-all cursor-pointer disabled:opacity-40"
                      >
                        {key === 'delete' ? <Delete className="size-5 text-slate-400" /> : key}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Action */}
                <button 
                  type="button" 
                  disabled={disabled || pin.some(d => d === '')}
                  onClick={() => attemptPinSubmit(pin)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-40 text-white text-xs font-black py-3.5 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck size={16} />
                  <span>{busy ? 'Authenticating…' : 'Access Partner Console'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Symmetrical Security Footer */}
          <footer className="text-center pt-3 border-t border-slate-800/80">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest flex items-center justify-center gap-1">
              <span>Secure Terminal Auth</span>
              <span>·</span>
              <span>End-to-End Encrypted</span>
            </p>
          </footer>

        </div>
      </div>
    </SvgScreenFrame>, 
    document.body
  );
}
