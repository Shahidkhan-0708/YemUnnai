import { SvgScreenFrame } from './SvgScreenFrame';
import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { X, AlertCircle, Delete, ShieldCheck, ArrowRight, RotateCcw } from 'lucide-react';
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

  const isCodeValid = storeCode.trim().length >= 3;
  const isPinComplete = pin.every(d => d !== '');

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

  // Handle store code input
  const handleStoreCodeChange = (raw: string) => {
    const clean = raw.toUpperCase().trim().replace(/[^A-Z0-9]/g, '');
    setStoreCode(clean);
    setCodeError(null);

    // Instant matching check
    const match = lookupOutletByStoreCode(clean, outlets);
    if (match) {
      playTapSound();
      setMatchedOutlet(match);
      setPin(['', '', '', '']);
      setError(null);
      setTimeout(() => {
        pinInputRefs[0].current?.focus();
      }, 100);
    }
  };

  const handleManualCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || !isCodeValid) return;
    const match = lookupOutletByStoreCode(storeCode, outlets);
    if (match) {
      playTapSound();
      setMatchedOutlet(match);
      setTimeout(() => pinInputRefs[0].current?.focus(), 100);
    } else {
      recordFailedAttempt();
      setCodeError(t('Unrecognized terminal code. Contact administrator.', 'గుర్తించబడని టెర్మినల్ కోడ్. నిర్వాహకుడిని సంప్రదించండి.'));
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
        setError(t(result.error ?? 'Incorrect security PIN. Please retry.', 'తప్పు భద్రతా PIN. మళ్లీ ప్రయత్నించండి.'));
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
        setError(t('Unable to reach kitchen server. Please retry.', 'కనెక్షన్ లేదు. మళ్లీ ప్రయత్నించండి.'));
        setPin(['', '', '', '']);
        pinInputRefs[0].current?.focus();
      }
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  const handlePinCellChange = (index: number, val: string) => {
    if (inFlight.current || activeLockoutSeconds > 0) return;
    const digit = val.replace(/\D/g, '').slice(-1);
    const nextPin = [...pin];
    nextPin[index] = digit;
    setPin(nextPin);
    setError(null);

    // Auto-advancing focus forward
    if (digit && index < 3) {
      pinInputRefs[index + 1].current?.focus();
    }

    // Auto-submission on 4th digit
    if (digit && index === 3 && nextPin.every(d => d !== '')) {
      void attemptPinSubmit(nextPin);
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Backspace auto-retreat focus backward
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinInputRefs[index - 1].current?.focus();
    }
  };

  const handleKeypadPress = (key: string) => {
    if (inFlight.current || activeLockoutSeconds > 0) return;
    playTapSound();

    if (key === 'delete') {
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
        className="vendor-login fixed inset-0 z-50 bg-black/80 backdrop-blur-md text-white font-sans selection:bg-orange-500 flex flex-col justify-end p-0"
      >
        {/* Top Dismiss Touch Area */}
        <div 
          className="flex-1 w-full cursor-pointer" 
          onClick={() => { if (!inFlight.current) onClose(); }}
          aria-hidden="true"
        />

        {/* NATIVE MOBILE BOTTOM-ANCHORED CONTROL SHEET CONTAINER */}
        <div className="w-full max-w-md mx-auto bg-slate-900 border-t border-slate-800 rounded-t-[2.5rem] rounded-b-none p-6 pt-3 pb-8 text-center text-white shadow-2xl relative overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom duration-250">
          
          {/* Native Grab Handle Pill */}
          <div className="w-12 h-1.5 bg-slate-700/60 rounded-full mx-auto my-3" aria-hidden="true" />

          {/* Close button */}
          <button 
            type="button" 
            onClick={onClose} 
            aria-label={t('Close login','ప్రవేశ విండో మూసివేయండి')} 
            disabled={busy}
            className="absolute top-4 right-5 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors disabled:opacity-50 cursor-pointer border border-slate-700"
          >
            <X size={15} />
          </button>

          {/* 1. PORTAL SECURITY FLOATING BADGE */}
          <div className="mb-4">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-black text-emerald-400 bg-emerald-950/50 border border-emerald-500/20 px-3 py-1 rounded-full uppercase tracking-widest shadow-2xs select-none">
              <ShieldCheck size={12} className="text-emerald-400" />
              <span>{t("Encrypted Partner Portal", "రక్షిత వ్యాపార గేట్‌వే")}</span>
            </div>
          </div>

          {/* 2. UNIFIED BRAND IDENTITY LAYER */}
          <div className="flex flex-col items-center mb-5">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center font-black text-white text-lg shadow-lg border border-orange-400/20 select-none">
              YM
            </div>
            <h2 id="vendor-login-title" className="text-xl font-black tracking-tight text-white mt-3 leading-none">
              {!matchedOutlet ? 'Merchant Terminal' : matchedOutlet.name}
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-1.5 tracking-wide max-w-[280px] leading-normal mx-auto">
              {!matchedOutlet 
                ? 'Enter your unique store code to unlock the kitchen console'
                : `Terminal identified as ${matchedOutlet.code}. Input 4-digit security PIN.`
              }
            </p>
          </div>

          {/* LOCKOUT ACTIVE NOTIFICATION */}
          {activeLockoutSeconds > 0 && (
            <div role="alert" className="mb-5 p-3.5 bg-rose-950/70 border border-rose-500/40 rounded-2xl text-center">
              <p className="text-xs font-black text-rose-300">Terminal Security Lock Active</p>
              <p className="text-[11px] text-rose-400 font-normal mt-0.5">
                Too many failed attempts. Device locked for {Math.floor(activeLockoutSeconds / 60)}:{String(activeLockoutSeconds % 60).padStart(2, '0')}.
              </p>
            </div>
          )}

          {/* STEP 1: BLIND STORE CODE ENTRY (BORDERLESS MATTE INPUT WITH BALANCED TYPOGRAPHY) */}
          {!matchedOutlet ? (
            <form onSubmit={handleManualCodeSubmit} className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="text-left">
                <label htmlFor="store-code-input" className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">
                  Terminal Store Code
                </label>
                {/* Borderless matte input with subtle shadow and soft typography placeholder */}
                <input 
                  id="store-code-input"
                  type="text"
                  autoFocus
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck="false"
                  maxLength={6}
                  disabled={disabled}
                  value={storeCode}
                  onChange={(e) => handleStoreCodeChange(e.target.value)}
                  placeholder="Enter shortcode (e.g., MITS)"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-5 py-3.5 text-center text-lg font-bold tracking-widest text-orange-400 placeholder:text-slate-500 placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-xs sm:placeholder:text-sm focus:outline-hidden focus:border-orange-500 focus:bg-slate-950 transition-all uppercase shadow-inner disabled:opacity-40"
                />

                {/* Tactile Quick-Select Chips for Kitchen Delivery Tablets */}
                <div className="flex items-center justify-center gap-2 pt-2.5 flex-wrap">
                  <span className="text-[10px] font-semibold text-slate-500">{t('Quick Pick:', 'త్వరిత ఎంపిక:')}</span>
                  {outlets.slice(0, 4).map((outlet) => {
                    const code = outlet.code || (outlet as any).shortCode || outlet.id;
                    return (
                      <button
                        key={outlet.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => handleStoreCodeChange(code)}
                        className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 hover:border-orange-500/50 hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-orange-400 transition-all active:scale-95 cursor-pointer disabled:opacity-40"
                      >
                        {code}
                      </button>
                    );
                  })}
                </div>

                {codeError && (
                  <p role="alert" className="flex items-center justify-center gap-1.5 text-xs text-rose-400 font-semibold mt-2.5">
                    <AlertCircle size={13} className="shrink-0" />
                    <span>{codeError}</span>
                  </p>
                )}
              </div>

              {/* ACTIVE STATE VIBRATION PHYSICS BUTTON */}
              <button 
                type="submit"
                disabled={disabled || !isCodeValid}
                className={`w-full py-4 text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 select-none ${
                  isCodeValid && !disabled
                    ? 'bg-orange-500 text-white hover:bg-orange-600 active:scale-[0.99] shadow-orange-500/25 cursor-pointer' 
                    : 'bg-slate-950 text-slate-600 border border-slate-800 cursor-not-allowed opacity-40'
                }`}
              >
                <span>Unlock Terminal</span>
                <ArrowRight size={14} />
              </button>
            </form>
          ) : (
            /* STEP 2: 4-BOX AUTO-ADVANCING PIN DECK WITH TACTILE TOUCH KEYPAD */
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2.5 text-center">
                  Secure Terminal PIN
                </label>
                
                {/* Symmetrical 4-Box Entry Layout */}
                <div className="flex justify-center gap-3">
                  {pin.map((digit, index) => (
                    <input
                      key={index}
                      ref={el => { pinInputRefs[index].current = el; }}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      disabled={disabled}
                      value={digit}
                      onChange={(e) => handlePinCellChange(index, e.target.value)}
                      onKeyDown={(e) => handlePinKeyDown(index, e)}
                      className="w-12 h-13 bg-slate-950 border border-slate-800 rounded-xl text-center text-xl font-black text-orange-400 focus:outline-hidden focus:border-orange-500 transition-all shadow-inner disabled:opacity-40"
                    />
                  ))}
                </div>

                {/* Error feedback */}
                {error && (
                  <p role="alert" className="flex items-center justify-center gap-1.5 text-xs text-rose-400 font-semibold mt-2.5 text-center">
                    <AlertCircle size={13} className="shrink-0" />
                    <span>{error}</span>
                  </p>
                )}
              </div>

              {/* On-screen tactile keypad for tablet touchscreens */}
              <div className="grid grid-cols-3 gap-2 pt-1" aria-label="PIN keypad">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'].map(key => key === '' ? (
                  <span key="space" />
                ) : (
                  <button 
                    key={key} 
                    type="button" 
                    disabled={disabled} 
                    aria-label={key === 'delete' ? 'Delete last digit' : key}
                    onClick={() => handleKeypadPress(key)}
                    className="flex h-12 items-center justify-center rounded-xl bg-slate-950 hover:bg-slate-800 active:scale-95 text-base font-black text-white border border-slate-800/80 transition-all cursor-pointer disabled:opacity-40"
                  >
                    {key === 'delete' ? <Delete className="size-4 text-slate-400" /> : key}
                  </button>
                ))}
              </div>

              {/* Final Submission Control Target */}
              <button 
                type="button"
                disabled={disabled || !isPinComplete}
                onClick={() => attemptPinSubmit(pin)}
                className={`w-full py-4 text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 select-none ${
                  isPinComplete && !disabled
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.99] shadow-emerald-600/25 cursor-pointer' 
                    : 'bg-slate-950 text-slate-600 border border-slate-800 cursor-not-allowed opacity-40'
                }`}
              >
                <ShieldCheck size={15} />
                <span>{busy ? 'Verifying…' : 'Verify Credentials'}</span>
              </button>

              {/* Reset Bridge back to Code Entry */}
              <button 
                type="button"
                onClick={handleSwitchAccount}
                className="text-[10px] font-black text-slate-500 hover:text-slate-300 uppercase tracking-wider block mx-auto transition-colors flex items-center gap-1 cursor-pointer pt-1"
              >
                <RotateCcw size={10} />
                <span>Switch Terminal Code</span>
              </button>
            </div>
          )}

          {/* 4. BALANCED MINIMALIST FOOTNOTE */}
          <div className="mt-5 pt-3 border-t border-slate-800/60 select-none">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
              Secure Terminal Auth · End-to-End Encrypted
            </p>
          </div>

        </div>
      </div>
    </SvgScreenFrame>, 
    document.body
  );
}
