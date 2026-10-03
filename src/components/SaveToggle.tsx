import React, { useState, useEffect } from 'react';
import { Bookmark, Check, Loader2 } from 'lucide-react';
import { playTapSound, playSuccessChime } from '../lib/celebration';
import { useLanguage } from '../lib/language';

export interface SaveToggleProps {
  size?: 'sm' | 'md' | 'lg';
  idleText?: string;
  savedText?: string;
  loadingDuration?: number;
  successDuration?: number;
  onStatusChange?: (status: 'idle' | 'loading' | 'saved') => void;
  isSaved?: boolean;
  onToggle?: (saved: boolean) => void;
  className?: string;
}

export const SaveToggle: React.FC<SaveToggleProps> = ({
  size = 'md',
  idleText = 'Save',
  savedText = 'Saved',
  loadingDuration = 1200,
  successDuration = 1000,
  onStatusChange,
  isSaved: controlledSaved,
  onToggle,
  className = '',
}) => {
  const { t } = useLanguage();
  const [internalSaved, setInternalSaved] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'saved'>('idle');

  const saved = controlledSaved !== undefined ? controlledSaved : internalSaved;

  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  const sizeClasses = {
    sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
    md: 'h-10 px-4 text-xs font-bold gap-2 rounded-xl',
    lg: 'h-12 px-5 text-sm font-extrabold gap-2.5 rounded-2xl',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-4.5 h-4.5',
  };

  const handleClick = () => {
    if (status === 'loading') return;

    playTapSound();

    if (controlledSaved !== undefined && onToggle) { onToggle(!saved); return; }

    if (saved) {
      // Toggle off
      setInternalSaved(false);
      setStatus('idle');
      onToggle?.(false);
      return;
    }

    // Toggle on: enter loading state
    setStatus('loading');

    setTimeout(() => {
      playSuccessChime();
      setInternalSaved(true);
      setStatus('saved');
      onToggle?.(true);

      if (successDuration > 0) {
        setTimeout(() => {
          setStatus('idle');
        }, successDuration);
      }
    }, loadingDuration);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={saved}
      aria-label={saved ? t('Remove from Saved', 'భద్రపరచిన వాటి నుండి తొలగించండి') : t('Save item', 'వంటకాన్ని భద్రపరచండి')}
      className={`inline-flex items-center justify-center transition-all duration-150 active:scale-96 cursor-pointer select-none ${
        sizeClasses[size]
      } ${
        saved || status === 'saved'
          ? 'bg-[#F06A05] text-white btn-orange-shadow'
          : status === 'loading'
          ? 'bg-[#E8ECEF] border border-[#D6DCE2] text-[#7A6658] cursor-wait'
          : 'bg-[#E8ECEF] text-[#1F140A] border border-[#D6DCE2] hover:bg-[#DDE2E8] tactile-card'
      } ${className}`}
    >
      {status === 'loading' ? (
        <>
          <Loader2 className={`${iconSizes[size]} animate-spin text-[#F06A05]`} />
          {idleText ? <span>Saving…</span> : null}
        </>
      ) : saved || status === 'saved' ? (
        <>
          <Check className={`${iconSizes[size]} stroke-[2.5]`} />
          {savedText ? <span>{savedText}</span> : null}
        </>
      ) : (
        <>
          <Bookmark className={`${iconSizes[size]}`} />
          {idleText ? <span>{idleText}</span> : null}
        </>
      )}
    </button>
  );
};

export default SaveToggle;
