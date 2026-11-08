import React, { useState, useEffect } from 'react';
import { Check, Clock, AlertCircle, Utensils, Zap, PartyPopper } from 'lucide-react';
import type { OrderStatus } from '../lib/types';
import { useLanguage } from '../lib/language';
import { playFoodReadyChime, fireOrderConfetti } from '../lib/celebration';

export interface OrderStatusTrackerProps {
  canteenName?: string;
  totalPrice: number;
  initialMinutes?: number;
  itemsCount?: number;
  pickupNumber?: number | string;
  orderId?: string;
  currentStatus?: OrderStatus;
  onClose: () => void;
  onCancel?: () => void;
}

export const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({
  canteenName = 'MITS Canteen',
  totalPrice,
  initialMinutes = 5,
  itemsCount = 1,
  pickupNumber,
  orderId,
  currentStatus = 'preparing',
  onClose,
  onCancel,
}) => {
  const { t } = useLanguage();
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const totalDuration = initialMinutes * 60;
  const [secondsRemaining, setSecondsRemaining] = useState(totalDuration);

  // Sync with prop update if parent updates
  useEffect(() => {
    if (currentStatus) setStatus(currentStatus);
  }, [currentStatus]);

  // Real-time Event Listener for instant "Mark As Ready" & state updates
  useEffect(() => {
    const handleStatusUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ orderId?: string; status?: OrderStatus }>;
      if (!customEvent.detail) return;
      if (!orderId || customEvent.detail.orderId === orderId) {
        if (customEvent.detail.status) {
          const nextStatus = customEvent.detail.status;
          setStatus(nextStatus);

          if (nextStatus === 'ready') {
            playFoodReadyChime();
            fireOrderConfetti();
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              try {
                navigator.vibrate([300, 100, 300]);
              } catch {
                // Ignore vibration failure
              }
            }
          } else if (nextStatus === 'collected') {
            fireOrderConfetti();
          }
        }
      }
    };

    window.addEventListener('order-status-updated', handleStatusUpdate);
    return () => window.removeEventListener('order-status-updated', handleStatusUpdate);
  }, [orderId]);

  // Active Countdown Timer (stops or snaps when ready/collected)
  useEffect(() => {
    if (status === 'ready' || status === 'collected') {
      setSecondsRemaining(0);
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  const progressPercent = status === 'ready' || status === 'collected'
    ? 100
    : Math.min(100, Math.max(0, ((totalDuration - secondsRemaining) / totalDuration) * 100));

  const formatCountdown = (totalSecs: number) => {
    if (status === 'ready') return t('READY NOW!', 'ఇప్పుడే సిద్ధంగా ఉంది!');
    if (status === 'collected') return t('PICKED UP', 'తీసుకున్నారు');
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isReady = status === 'ready';
  const isCollected = status === 'collected';

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden font-sans p-5 sm:p-6 text-center animate-in fade-in zoom-in-95 duration-200">
      
      {/* 1. Header Confirmation Status */}
      <div className="flex flex-col items-center mb-5">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 shadow-inner ring-4 transition-all duration-300 ${
          isReady
            ? 'bg-emerald-500 text-white ring-emerald-200/60 scale-105'
            : isCollected
            ? 'bg-blue-600 text-white ring-blue-200/60'
            : 'bg-emerald-50 text-emerald-600 ring-emerald-50/50'
        }`}>
          {isReady ? (
            <PartyPopper size={26} className="text-white animate-bounce" />
          ) : (
            <Utensils size={24} className={isCollected ? 'text-white' : 'text-emerald-600'} />
          )}
        </div>

        <h3 className="text-lg sm:text-xl font-black text-gray-950 tracking-tight">
          {isReady 
            ? t('Your Food is Ready at Counter!', 'మీ ఆహారం కౌంటర్ వద్ద సిద్ధంగా ఉంది!')
            : isCollected 
            ? t('Order Picked Up & Paid', 'ఆర్డర్ తీసుకున్నారు & చెల్లించారు')
            : t('Order Pushed to Kitchen', 'ఆర్డర్ వంటగదికి పంపబడింది')}
        </h3>

        <p className="text-xs text-gray-500 font-normal mt-1">
          <span className="font-semibold text-gray-800">{canteenName}</span>{' '}
          {isReady 
            ? t('counter waiting · collect now', 'కౌంటర్ వద్ద వేచి ఉంది · ఇప్పుడే తీసుకోండి')
            : `${t('kitchen alerted', 'వంటగదికి సమాచారం అందింది')} · ${itemsCount} ${itemsCount === 1 ? t('item', 'వంటకం') : t('items', 'వంటకాలు')}`}
        </p>

        {pickupNumber && (
          <div className={`mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all ${
            isReady
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200 shadow-sm'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {t('Token', 'టోకెన్')}
            </span>
            <span className={`text-base font-black font-mono ${isReady ? 'text-emerald-700' : 'text-gray-950'}`}>
              #{pickupNumber}
            </span>
          </div>
        )}
      </div>

      {/* 2. Interactive Countdown Timer with Live Progress Bar */}
      <div className={`border rounded-2xl p-4 mb-5 shadow-2xs transition-all ${
        isReady 
          ? 'bg-emerald-50/70 border-emerald-200' 
          : 'bg-gray-50/80 border-gray-150'
      }`}>
        <div className="flex items-center justify-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
          <Clock size={12} className={isReady ? 'text-emerald-600' : 'text-orange-500'} />
          <span>{isReady ? t('Status', 'స్థితి') : t('Estimated Arrival', 'అంచనా వేసిన రాక సమయం')}</span>
        </div>

        <span className={`text-2xl sm:text-3xl font-black tracking-tight block font-mono ${
          isReady ? 'text-emerald-600 animate-pulse' : 'text-orange-500'
        }`}>
          {formatCountdown(secondsRemaining)}
        </span>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 h-1.5 rounded-full mt-3 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${
              isReady ? 'bg-emerald-500' : 'bg-orange-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <p className="text-[11px] text-gray-500 font-normal mt-2">
          {isReady ? (
            <span className="text-emerald-700 font-bold">
              {t('Ready for pickup at counter now', 'కౌంటర్ వద్ద తీసుకోవడానికి సిద్ధంగా ఉంది')}
            </span>
          ) : (
            <>
              {t('Walking distance:', 'నడిచే దూరం:')}{' '}
              <span className="font-semibold text-gray-700">~50m</span>{' '}
              {t('from academic block', 'అకడమిక్ బ్లాక్ నుండి')}
            </>
          )}
        </p>
      </div>

      {/* 3. Minimalist App Step Tracker */}
      <div className="px-2 mb-5">
        <div className="flex items-center justify-between relative">
          {/* Tracker Background Connecting Line */}
          <div className="absolute left-6 right-6 top-3.5 h-0.5 bg-gray-150 -z-10" />
          <div 
            className="absolute left-6 top-3.5 h-0.5 bg-emerald-500 -z-10 transition-all duration-500"
            style={{ width: isReady || isCollected ? 'calc(100% - 48px)' : '50%' }}
          />

          {/* Step 1: Sent */}
          <div className="flex flex-col items-center bg-white px-2">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-semibold shadow-xs">
              <Check size={13} strokeWidth={3} />
            </div>
            <span className="text-[11px] font-semibold text-gray-900 mt-1.5">
              {t('Sent', 'పంపబడింది')}
            </span>
          </div>

          {/* Step 2: Preparing */}
          <div className="flex flex-col items-center bg-white px-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
              isReady || isCollected
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 border-2 border-emerald-500 text-emerald-600 animate-pulse'
            }`}>
              {isReady || isCollected ? (
                <Check size={13} strokeWidth={3} />
              ) : (
                <Zap size={12} className="text-emerald-600 fill-emerald-600" />
              )}
            </div>
            <span className={`text-[11px] mt-1.5 ${
              isReady || isCollected ? 'font-semibold text-gray-900' : 'font-black text-emerald-600'
            }`}>
              {t('Preparing', 'తయారు చేస్తున్నారు')}
            </span>
          </div>

          {/* Step 3: Ready */}
          <div className="flex flex-col items-center bg-white px-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold transition-all ${
              isReady || isCollected
                ? 'bg-emerald-600 text-white shadow-xs ring-4 ring-emerald-100 animate-pulse'
                : 'bg-white border-2 border-gray-200 text-gray-400'
            }`}>
              {isReady || isCollected ? <Check size={13} strokeWidth={3} /> : '3'}
            </div>
            <span className={`text-[11px] mt-1.5 ${
              isReady ? 'font-black text-emerald-600' : 'font-semibold text-gray-400'
            }`}>
              {t('Ready', 'సిద్ధంగా ఉంది')}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Pay-On-Pickup Token Box */}
      <div className={`border rounded-2xl p-3.5 text-left shadow-2xs mb-5 transition-all ${
        isReady
          ? 'bg-emerald-50/80 border-emerald-200'
          : 'bg-amber-50/70 border-amber-200/70'
      }`}>
        <div className="flex items-start gap-2.5">
          <AlertCircle size={16} className={`flex-shrink-0 mt-0.5 ${isReady ? 'text-emerald-600' : 'text-amber-600'}`} />
          <div>
            <h4 className={`text-xs font-black uppercase tracking-wider ${isReady ? 'text-emerald-950' : 'text-amber-950'}`}>
              {isReady ? t('Collect Order at Counter', 'కౌంటర్ వద్ద ఆహారాన్ని తీసుకోండి') : t('Pay at Counter', 'కౌంటర్ వద్ద చెల్లించండి')}
            </h4>
            <p className={`text-[11px] font-normal mt-0.5 leading-relaxed ${isReady ? 'text-emerald-900' : 'text-amber-900'}`}>
              {t('Show this token to the manager on arrival. Settle the bill of', 'కౌంటర్ వద్ద ఈ టోకెన్ చూపించండి. బిల్లు మొత్తం')}{' '}
              <span className="font-black text-gray-950 text-xs">₹{totalPrice}</span>{' '}
              {t('at the counter via Cash or UPI QR.', 'నగదు లేదా UPI QR ద్వారా చెల్లించండి.')}
            </p>
          </div>
        </div>
      </div>

      {/* 5. Symmetrical Action Buttons */}
      <div className="flex gap-2.5">
        <button 
          type="button"
          onClick={onCancel || onClose}
          className="flex-1 bg-gray-100 hover:bg-gray-200 active:scale-98 text-gray-700 text-xs font-semibold py-3 rounded-xl transition-all cursor-pointer"
        >
          {t('Dismiss', 'మూసివేయి')}
        </button>
        <button 
          type="button"
          onClick={onClose}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-black py-3 rounded-xl shadow-xs transition-all cursor-pointer"
        >
          {t('Done · View Orders', 'పూర్తయింది · ఆర్డర్లు చూడండి')}
        </button>
      </div>

    </div>
  );
};

export default OrderStatusTracker;
