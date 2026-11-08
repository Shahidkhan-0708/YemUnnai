import { SvgScreenFrame } from './SvgScreenFrame';
import { createPortal } from 'react-dom';
import { CatalogImage } from './CatalogImage';
import { useEffect, useRef, useState } from 'react';
import { X, AlertCircle, Delete, ShieldCheck } from 'lucide-react';
import { useVendorSession, useShops } from '../lib/hooks';
import { useModalA11y } from '../lib/useModalA11y';
import { useLanguage } from '../lib/language';
import { VENDOR_OUTLETS } from '../lib/vendorAuth';
import { playTapSound, playSuccessChime } from '../lib/celebration';
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
  const { shops, loading: shopsLoading, error: shopsError, retry: retryShops } = useShops();
  const outlets = shops.length ? shops : shopsLoading ? VENDOR_OUTLETS : [];
  const [outletId, setOutletId] = useState(VENDOR_OUTLETS[0].id);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [retryAt, setRetryAt] = useState<Record<string, number>>({});
  const [now, setNow] = useState(() => Date.now());
  const inFlight = useRef(false);
  const generation = useRef(0);
  const pinInputRef = useRef<HTMLInputElement | null>(null);
  const rootRef = useModalA11y<HTMLDivElement>(isOpen, () => { if (!inFlight.current) onClose(); });

  const outletRetrySeconds = Math.max(0, Math.ceil(((retryAt[outletId] ?? 0) - now) / 1000));
  const deviceLockSeconds = Math.max(0, Math.ceil((terminalLockoutUntil - now) / 1000));
  const activeLockoutSeconds = Math.max(outletRetrySeconds, deviceLockSeconds);
  const disabled = busy || activeLockoutSeconds > 0;

  useEffect(() => {
    if (!isOpen || shopsLoading) return;
    if (!shops.some(shop => shop.id === outletId)) {
      setOutletId(shops[0]?.id ?? VENDOR_OUTLETS[0].id);
      setPin('');
    }
  }, [isOpen, shopsLoading, shops, outletId]);

  useEffect(() => {
    generation.current++;
    setPin('');
    setError(null);
    setIsShaking(false);
    setIsSuccess(false);
    if (!isOpen) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    setTimeout(() => pinInputRef.current?.focus(), 150);
    return () => { clearInterval(timer); generation.current++; };
  }, [isOpen]);

  const attemptPin = async (candidate: string) => {
    if (inFlight.current || disabled || !/^\d{4}$/.test(candidate)) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    const current = generation.current;

    try {
      const result = await signInWithOutlet(outletId, candidate);
      if (current !== generation.current) return;
      if (result.ok) {
        resetFailedAttempts();
        setIsSuccess(true);
        playSuccessChime();
        try {
          sessionStorage.removeItem('terminal_velocity_attempts');
          sessionStorage.removeItem('terminal_lockout_until');
        } catch {
          // ignore
        }
        setTimeout(() => {
          onSignedIn?.();
          onClose();
          window.dispatchEvent(new Event('yem-login-success'));
        }, 400);
      } else {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 450);
        recordFailedAttempt();
        setError(t(result.error ?? 'Incorrect security PIN. Please retry.', 'తప్పు భద్రతా PIN. మళ్లీ ప్రయత్నించండి.'));
        setPin('');
        pinInputRef.current?.focus();
        if (result.retrySeconds) {
          const timestamp = Date.now();
          setNow(timestamp);
          setRetryAt(prev => ({ ...prev, [outletId]: timestamp + result.retrySeconds! * 1000 }));
        }
      }
    } catch {
      if (current === generation.current) {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 450);
        recordFailedAttempt();
        setError(t('Unable to reach kitchen server. Please retry.', 'కనెక్షన్ లేదు. మళ్లీ ప్రయత్నించండి.'));
        setPin('');
        pinInputRef.current?.focus();
      }
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  const updatePin = (value: string) => {
    if (inFlight.current || disabled) return;
    const candidate = value.replace(/\D/g, '').slice(0, 4);
    playTapSound();
    setPin(candidate);
    setError(null);
    if (candidate.length === 4) {
      void attemptPin(candidate);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <SvgScreenFrame screen={null}>
      <div 
        ref={rootRef} 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="vendor-login-title"
        className="vendor-login fixed inset-0 z-50 overflow-y-auto bg-[#E8ECEF] text-[#1F140A] flex flex-col items-center justify-center p-4 sm:p-6"
      >
        <div className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#D6DCE2] relative animate-in zoom-in-95 duration-200">
          {/* Header row */}
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {t("Business Portal", "వ్యాపార పేజీ")}
            </span>
            <button 
              type="button" 
              onClick={onClose} 
              aria-label={t('Close login','ప్రవేశ విండో మూసివేయండి')} 
              disabled={busy}
              className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors disabled:opacity-50 cursor-pointer border border-gray-200/60"
            >
              <X size={18} />
            </button>
          </div>

          {/* Logo badge */}
          <div className="flex flex-col items-center mt-2">
            <CatalogImage 
              src="/images/NewLogo.svg" 
              size="thumbnail" 
              priority 
              alt="YEMUNNAI" 
              className="size-16 rounded-full bg-[#F06A05] object-contain p-2 shadow-md" 
            />
            <h2 id="vendor-login-title" className="mt-4 text-center text-2xl font-bold text-gray-900 leading-tight">
              {t("Canteen sign in", "కేఫ్ యజమాని ప్రవేశం")}
            </h2>
            <p className="mt-1.5 text-center text-sm text-[#7A6658] font-medium">
              {t("Choose a canteen and enter its PIN.", "మీ కేఫ్ ఎంచుకుని నాలుగు అంకెల PIN నమోదు చేయండి.")}
            </p>
          </div>

          {/* Active lockout alert */}
          {activeLockoutSeconds > 0 && (
            <div role="alert" className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
              <p className="text-xs font-bold text-rose-700">Terminal Security Lock Active</p>
              <p className="text-[11px] text-rose-600 mt-0.5">
                Too many failed attempts. Try again in {Math.floor(activeLockoutSeconds / 60)}:{String(activeLockoutSeconds % 60).padStart(2, '0')}.
              </p>
            </div>
          )}

          {/* Form */}
          <form 
            className="mt-5 space-y-4" 
            onSubmit={(e) => { e.preventDefault(); void attemptPin(pin); }}
          >
            {/* Canteen Dropdown */}
            <div className="text-left">
              <label htmlFor="vendor-outlet" className="text-xs font-bold text-gray-900 block mb-1.5">
                {t("Canteen", "క్యాంటీన్ దుకాణం")}
              </label>
              <select 
                id="vendor-outlet" 
                value={outletId} 
                disabled={busy}
                onChange={(e) => { setOutletId(e.target.value); setPin(''); setError(null); }}
                className="h-12 w-full min-w-0 rounded-xl bg-white border-2 border-[#F06A05] px-3.5 text-sm font-bold text-gray-900 shadow-xs focus:outline-hidden cursor-pointer"
              >
                <option value="" disabled>Choose a food business</option>
                {outlets.map((outlet) => (
                  <option key={outlet.id} value={outlet.id}>
                    {outlet.name}
                  </option>
                ))}
              </select>
              {shopsError && (
                <button type="button" onClick={retryShops} className="mt-1 text-xs text-orange-600 font-semibold cursor-pointer">
                  Refresh business list
                </button>
              )}
            </div>

            {/* 4-digit PIN input */}
            <div className="text-left">
              <label htmlFor="vendor-pin" className="text-xs font-bold text-gray-900 block mb-1.5">
                {t("4-digit PIN", "భద్రతా PIN (4 అంకెలు)")}
              </label>
              <input 
                ref={pinInputRef}
                id="vendor-pin" 
                type="password" 
                inputMode="numeric" 
                autoComplete="off" 
                maxLength={4}
                pattern="[0-9]{4}" 
                required 
                value={pin} 
                disabled={disabled || isSuccess} 
                onChange={(e) => updatePin(e.target.value)}
                placeholder="····"
                aria-describedby="vendor-login-message"
                className={`h-12 w-full rounded-xl bg-white border px-4 text-center text-2xl font-bold tracking-[0.75em] text-gray-900 shadow-xs focus:outline-hidden transition-all ${
                  isSuccess
                    ? 'border-2 border-emerald-500 bg-emerald-50/50 text-emerald-700 ring-2 ring-emerald-500/20'
                    : isShaking
                    ? 'pin-shake border-2 border-rose-500 bg-rose-50/50 text-rose-700 ring-2 ring-rose-500/20'
                    : 'border-gray-200 focus:border-[#F06A05] focus:ring-2 focus:ring-orange-500/20'
                } disabled:opacity-50`}
              />
              
              <div id="vendor-login-message" className="mt-2 min-h-5 text-center" aria-live="polite">
                {error ? (
                  <p role="alert" className="flex items-center justify-center gap-1.5 text-xs text-rose-600 font-semibold">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{error}</span>
                  </p>
                ) : (
                  <p className="text-xs text-[#7A6658]">
                    Sign-in starts after the fourth digit.
                  </p>
                )}
              </div>
            </div>

            {/* Tactile Keypad */}
            <div className="grid grid-cols-3 gap-3 pt-1" aria-label="PIN keypad">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'].map((key) => key === '' ? (
                <span key="space" />
              ) : (
                <button 
                  key={key} 
                  type="button" 
                  disabled={disabled || isSuccess} 
                  aria-label={key === 'delete' ? 'Delete last digit' : key}
                  onClick={() => updatePin(key === 'delete' ? pin.slice(0, -1) : pin + key)}
                  className="flex h-12 items-center justify-center rounded-xl bg-white border border-gray-200/90 hover:bg-gray-50 active:scale-95 text-xl font-bold text-gray-900 shadow-xs transition-all cursor-pointer disabled:opacity-40 select-none"
                >
                  {key === 'delete' ? <Delete className="size-5 text-gray-700" /> : key}
                </button>
              ))}
            </div>

            {/* Sign in Button */}
            <button 
              type="submit" 
              disabled={disabled || pin.length !== 4 || isSuccess}
              className={`w-full h-12 rounded-xl text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm ${
                isSuccess
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30 ring-2 ring-emerald-500/40 cursor-default'
                  : pin.length === 4 && !disabled
                  ? 'bg-[#F06A05] hover:bg-[#d95e04] active:scale-[0.99] text-white shadow-orange-500/25 cursor-pointer'
                  : 'bg-gray-200 text-gray-400 border border-gray-200 cursor-not-allowed'
              }`}
            >
              <ShieldCheck size={16} />
              <span>
                {isSuccess ? 'Access Granted · Opening Console...' : busy ? 'Signing in…' : 'Sign in'}
              </span>
            </button>
          </form>
        </div>
      </div>
    </SvgScreenFrame>,
    document.body
  );
}
