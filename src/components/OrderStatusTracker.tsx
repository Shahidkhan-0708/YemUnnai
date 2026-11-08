import React, { useState, useEffect } from 'react';
import { Check, AlertCircle, Utensils, Zap, PartyPopper, ConciergeBell } from 'lucide-react';
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
    <div className="w-full max-w-sm sm:max-w-md mx-auto bg-white rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-6 shadow-2xl border border-gray-100 font-sans antialiased text-gray-950 flex flex-col justify-between overflow-y-auto max-h-[90vh] pb-[calc(2rem+env(safe-area-inset-bottom,0px))] sm:pb-6 text-center animate-in fade-in zoom-in-95 duration-200">
      
      {/* 1. TOP BRAND SIGNATURE & FEEDBACK DECK */}
      <div className="text-center flex flex-col items-center pt-1">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl border transition-all duration-300 shadow-2xs ${
          isReady
            ? 'bg-emerald-500 text-white border-emerald-400 ring-4 ring-emerald-200/60 scale-105'
            : isCollected
            ? 'bg-blue-600 text-white border-blue-500 ring-4 ring-blue-200/60'
            : 'bg-emerald-50 text-emerald-600 border-emerald-100/60'
        }`}>
          {isReady ? (
            <PartyPopper size={24} className="text-white animate-bounce" />
          ) : (
            <Utensils size={20} className={isCollected ? 'text-white' : 'text-emerald-600'} />
          )}
        </div>

        <h2 className="text-lg font-black text-gray-950 tracking-tight mt-3.5 leading-tight">
          {isReady 
            ? t('Your Food is Ready at Counter!', 'మీ ఆహారం కౌంటర్ వద్ద సిద్ధంగా ఉంది!')
            : isCollected 
            ? t('Order Picked Up & Paid', 'ఆర్డర్ తీసుకున్నారు & చెల్లించారు')
            : t('Order Pushed to Kitchen', 'ఆర్డర్ వంటగదికి పంపబడింది')}
        </h2>

        <p className="text-2xs text-gray-400 font-semibold tracking-wide mt-1.5 uppercase">
          {canteenName} {isReady 
            ? t('counter waiting · collect now', 'కౌంటర్ వద్ద వేచి ఉంది · ఇప్పుడే తీసుకోండి')
            : `${t('kitchen alerted', 'వంటగదికి సమాచారం అందింది')}`}
          {!isReady && (
            <>
              <span className="text-gray-300 mx-1">·</span>
              {itemsCount} {itemsCount === 1 ? t('item', 'వంటకం') : t('items', 'వంటకాలు')}
            </>
          )}
        </p>

        {/* Token Badge with Balanced Padding Metrics & Non-Compressed Vertical Margin */}
        {pickupNumber && (
          <span className={`mt-3.5 inline-flex items-center gap-1.5 border text-[10px] font-black px-3.5 py-1 rounded-md uppercase tracking-widest font-mono shadow-2xs transition-all ${
            isReady
              ? 'bg-emerald-100/90 border-emerald-300 text-emerald-800 ring-2 ring-emerald-200/70'
              : 'bg-emerald-50 border-emerald-100 text-emerald-700'
          }`}>
            <span className="text-emerald-600/80 font-bold">{t('Token', 'టోకెన్')}</span>
            <span className="text-xs font-black">#{pickupNumber}</span>
          </span>
        )}
      </div>

      {/* 2. CORE ESTIMATED TIMELINE BAR CONTROLLER */}
      <div className={`my-5 sm:my-6 border rounded-2xl p-4 sm:p-5 text-center shadow-inner transition-all ${
        isReady 
          ? 'bg-emerald-50/70 border-emerald-200' 
          : 'bg-gray-50/50 border-gray-100'
      }`}>
        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">
          {isReady ? t('Status', 'స్థితి') : `⏱ ${t('Estimated Arrival', 'అంచనా వేసిన రాక సమయం')}`}
        </span>

        <h3 className={`text-3xl font-black font-mono tracking-tighter mt-1.5 leading-none ${
          isReady ? 'text-emerald-600 animate-pulse' : 'text-orange-600'
        }`}>
          {formatCountdown(secondsRemaining)}
        </h3>
        
        {/* Symmetrical Track Progression Bar */}
        <div className="w-full bg-gray-200 h-1.5 rounded-full mt-4 relative overflow-hidden">
          <div 
            className={`absolute top-0 bottom-0 left-0 rounded-full transition-all duration-1000 ease-linear ${
              isReady ? 'bg-emerald-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <p className="text-2xs text-gray-400 font-medium mt-3">
          {isReady ? (
            <span className="text-emerald-700 font-bold">
              {t('Ready for pickup at counter now', 'కౌంటర్ వద్ద తీసుకోవడానికి సిద్ధంగా ఉంది')}
            </span>
          ) : (
            <>
              {t('Walking distance:', 'నడిచే దూరం:')}{' '}
              <span className="font-bold text-gray-700">~50m</span>{' '}
              {t('from academic block', 'అకడమిక్ బ్లాక్ నుండి')}
            </>
          )}
        </p>
      </div>

      {/* 3. STEPPER INTEGRITY STATUS DECK */}
      <div className="flex justify-between items-center px-4 mb-5 sm:mb-6 relative">
        <div className="absolute left-8 right-8 top-3 h-[1px] bg-gray-100 -z-10" />
        <div 
          className="absolute left-8 top-3 h-[1px] bg-emerald-500 -z-10 transition-all duration-500"
          style={{ width: isReady || isCollected ? 'calc(100% - 64px)' : '50%' }}
        />
        
        {/* Step 1: Sent */}
        <div className="flex flex-col items-center gap-1.5 bg-white px-1">
          <div className="w-7 h-7 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-xs">
            <Check size={13} strokeWidth={3} />
          </div>
          <span className="text-[10px] font-black text-gray-900 uppercase">
            {t('Sent', 'పంపబడింది')}
          </span>
        </div>
        
        {/* Step 2: Preparing */}
        <div className="flex flex-col items-center gap-1.5 bg-white px-1">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
            isReady || isCollected
              ? 'bg-emerald-500 text-white shadow-xs'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-2xs animate-pulse'
          }`}>
            {isReady || isCollected ? (
              <Check size={13} strokeWidth={3} />
            ) : (
              <Zap size={12} className="text-emerald-600 fill-emerald-600" />
            )}
          </div>
          <span className={`text-[10px] uppercase ${
            isReady || isCollected ? 'font-black text-gray-900' : 'font-black text-emerald-600'
          }`}>
            {t('Preparing', 'తయారు చేస్తున్నారు')}
          </span>
        </div>
        
        {/* Step 3: Ready (Elevated from wireframe '3' to cohesive illuminated badge glyph) */}
        <div className="flex flex-col items-center gap-1.5 bg-white px-1">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
            isReady || isCollected
              ? 'bg-emerald-600 text-white shadow-xs ring-4 ring-emerald-100 animate-pulse'
              : 'bg-white border border-gray-200 text-gray-400 shadow-2xs'
          }`}>
            {isReady || isCollected ? (
              <Check size={13} strokeWidth={3} />
            ) : (
              <ConciergeBell size={12} className="text-gray-400" />
            )}
          </div>
          <span className={`text-[10px] uppercase ${
            isReady ? 'font-black text-emerald-600' : 'font-bold text-gray-400'
          }`}>
            {t('Ready', 'సిద్ధంగా ఉంది')}
          </span>
        </div>
      </div>

      {/* 4. TRANSACTION BILL REMINDER CARD */}
      <div className={`border rounded-2xl p-4 text-left shadow-2xs mb-5 transition-all ${
        isReady
          ? 'bg-emerald-50/80 border-emerald-200'
          : 'bg-amber-50/60 border-amber-100'
      }`}>
        <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider ${
          isReady ? 'text-emerald-800' : 'text-amber-800'
        }`}>
          <AlertCircle size={13} className={isReady ? 'text-emerald-600' : 'text-amber-600'} />
          <span>{isReady ? t('Collect Order at Counter', 'కౌంటర్ వద్ద ఆహారాన్ని తీసుకోండి') : t('Pay at Counter', 'కౌంటర్ వద్ద చెల్లించండి')}</span>
        </div>
        <p className={`text-2xs font-medium mt-1 leading-relaxed ${
          isReady ? 'text-emerald-900/80' : 'text-amber-900/80'
        }`}>
          {t('Show this token to the manager on arrival. Settle the bill of', 'కౌంటర్ వద్ద ఈ టోకెన్ చూపించండి. బిల్లు మొత్తం')}{' '}
          <span className={`font-black text-xs ${isReady ? 'text-emerald-950' : 'text-amber-950'}`}>₹{totalPrice}</span>{' '}
          {t('at the counter via Cash or UPI QR.', 'నగదు లేదా UPI QR ద్వారా చెల్లించండి.')}
        </p>
      </div>

      {/* 5. FULLY UNVEILED BASELINE INTERACTIVE CTA (Brought safely into viewport view) */}
      <div className="mt-2 sm:mt-4 pt-3 border-t border-gray-100/80 flex gap-2.5 flex-shrink-0">
        <button 
          type="button"
          onClick={onCancel || onClose}
          className="flex-1 bg-gray-100 hover:bg-gray-200 active:scale-[0.98] text-gray-700 text-xs font-bold py-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-center"
        >
          {t('Dismiss', 'మూసివేయి')}
        </button>
        <button 
          type="button"
          onClick={onClose}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-black py-3.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span>{t('Done · View Orders', 'పూర్తయింది · ఆర్డర్లు చూడండి')}</span>
        </button>
      </div>

    </div>
  );
};

export default OrderStatusTracker;
