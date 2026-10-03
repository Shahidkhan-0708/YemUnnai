import { SvgScreenFrame } from './SvgScreenFrame';
'use client';

import React, { useState, useRef } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import { playTapSound, playSuccessChime } from '../lib/celebration';
import { toast } from './ui/sonner';
import { useModalA11y } from '../lib/useModalA11y';

export interface FamilyReceiveComponentProps {
  triggerLabel?: string;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  icon?: React.ReactNode;
  onConfirm?: () => Promise<void> | void;
  onCancel?: () => void;
  className?: string;
  variant?: 'primary' | 'orange' | 'neumorphic';
  disabled?: boolean;
}

export const FamilyReceiveComponent: React.FC<FamilyReceiveComponentProps> = ({
  triggerLabel = 'Receive',
  title = 'Confirm',
  description = 'Are you sure you want to proceed?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  icon,
  onConfirm,
  onCancel,
  className = '',
  variant = 'primary',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  const handleOpen = () => {
    if (disabled || isProcessing) return;
    setErrorMsg(null);
    playTapSound();
    setIsOpen(true);
  };

  const handleClose = () => {
    if (isProcessing) return; // Prevent closing mid-mutation
    playTapSound();
    setIsOpen(false);
    setErrorMsg(null);
    onCancel?.();
  };
  const modalRef = useModalA11y<HTMLDivElement>(isOpen, handleClose);

  const handleConfirm = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setErrorMsg(null);
    playTapSound();

    try {
      if (onConfirm) {
        await Promise.resolve(onConfirm());
      }
      playSuccessChime();
      setIsOpen(false);
    } catch (err: any) {
      const msg = err?.message || 'Failed to update order status. Please try again.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return <SvgScreenFrame screen={'collection'} visible={isOpen}>(
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors duration-150 active:scale-97 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed ${
          variant === 'primary' || variant === 'orange'
            ? 'bg-[#F06A05] text-white hover:bg-[#D85800] btn-orange-shadow'
            : 'bg-[#E8ECEF] text-[#1F140A] border border-[#D6DCE2] tactile-card hover:bg-[#DDE2E8]'
        } ${className}`}
      >
        <span className="shrink-0 flex items-center justify-center">
          {icon ? (
            React.isValidElement(icon)
              ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
                  className: 'w-4 h-4 text-current'
                })
              : icon
          ) : (
            null
          )}
        </span>
        <span>{triggerLabel}</span>
      </button>

      {/* Confirmation Modal / Sheet Overlay */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="family-receive-title"
          aria-describedby="family-receive-desc"
          className="pickup-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isProcessing) handleClose();
          }}
        >
          <div
            ref={modalRef}
            className="pickup-sheet collection-sheet"
          >
            {/* Top Close Button */}
            {!isProcessing && (
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close"
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#E8ECEF] border border-[#D6DCE2] flex items-center justify-center text-[#7A6658] hover:text-[#1F140A] active:scale-90 transition-transform cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Central Illuminated Icon */}
            <div className="flex flex-col items-start text-left mt-2">
              <div className="sheet-handle"/>{/* Title & Description */}
              <h3
                id="family-receive-title"
                className="sheet-title"
              >
                {title}
              </h3>
              <p
                id="family-receive-desc"
                className="sheet-subtitle leading-relaxed"
              >
                {description}
              </p>

              {/* Error Banner if update fails */}
              {errorMsg && (
                <div className="mt-3 w-full p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col gap-2.5">
              <button
                ref={confirmBtnRef}
                type="button"
                onClick={handleConfirm}
                disabled={isProcessing}
                className="w-full h-12 rounded-xl bg-[#F06A05] hover:bg-[#D85800] text-white font-semibold text-sm flex items-center justify-center gap-2 btn-orange-shadow cursor-pointer transition-colors active:scale-98 disabled:opacity-70"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Confirming…</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" strokeWidth={2.8} />
                    <span>{confirmLabel}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleClose}
                disabled={isProcessing}
                className="w-full h-10 rounded-xl bg-[#E8ECEF] border border-[#D6DCE2] text-[#7A6658] hover:text-[#1F140A] font-bold text-xs flex items-center justify-center transition-colors cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {cancelLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )</SvgScreenFrame>;
};

export default FamilyReceiveComponent;
