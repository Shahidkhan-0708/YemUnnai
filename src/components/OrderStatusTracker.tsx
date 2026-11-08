import React, { useState, useEffect } from 'react';
import { Check, Clock, AlertCircle, Utensils, Zap } from 'lucide-react';

export interface OrderStatusTrackerProps {
  canteenName?: string;
  totalPrice: number;
  initialMinutes?: number;
  itemsCount?: number;
  pickupNumber?: number | string;
  orderId?: string;
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
  onClose,
  onCancel
}) => {
  const totalDuration = initialMinutes * 60;
  const [secondsRemaining, setSecondsRemaining] = useState(totalDuration);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const progressPercent = Math.min(100, Math.max(0, ((totalDuration - secondsRemaining) / totalDuration) * 100));

  const formatCountdown = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden font-sans p-5 sm:p-6 text-center animate-in fade-in zoom-in-95 duration-200">
      
      {/* 1. Header Confirmation Status */}
      <div className="flex flex-col items-center mb-5">
        <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 shadow-inner ring-4 ring-emerald-50/50">
          <Utensils size={24} className="text-emerald-600" />
        </div>
        <h3 className="text-lg sm:text-xl font-black text-gray-950 tracking-tight">
          Order Pushed to Kitchen
        </h3>
        <p className="text-xs text-gray-500 font-normal mt-1">
          <span className="font-semibold text-gray-800">{canteenName}</span> kitchen alerted · {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
        </p>

        {pickupNumber && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 border border-gray-200 rounded-full">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Token</span>
            <span className="text-sm font-black text-gray-950 font-mono">#{pickupNumber}</span>
          </div>
        )}
      </div>

      {/* 2. Interactive Countdown Timer with Live Progress Bar */}
      <div className="bg-gray-50/80 border border-gray-150 rounded-2xl p-4 mb-5 shadow-2xs">
        <div className="flex items-center justify-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
          <Clock size={12} className="text-orange-500" />
          <span>Estimated Arrival</span>
        </div>
        <span className="text-3xl sm:text-4xl font-black text-orange-500 tracking-tight block font-mono">
          {formatCountdown(secondsRemaining)}
        </span>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 h-1.5 rounded-full mt-3 overflow-hidden">
          <div 
            className="bg-orange-500 h-full rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <p className="text-[11px] text-gray-500 font-normal mt-2">
          Walking distance: <span className="font-semibold text-gray-700">~50m</span> from academic block
        </p>
      </div>

      {/* 3. Minimalist App Step Tracker */}
      <div className="px-2 mb-5">
        <div className="flex items-center justify-between relative">
          {/* Tracker Background Connecting Line */}
          <div className="absolute left-6 right-6 top-3.5 h-0.5 bg-gray-150 -z-10" />
          <div className="absolute left-6 w-1/2 top-3.5 h-0.5 bg-emerald-500 -z-10 transition-all duration-500" />

          {/* Step 1: Sent */}
          <div className="flex flex-col items-center bg-white px-2">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-semibold shadow-xs">
              <Check size={13} strokeWidth={3} />
            </div>
            <span className="text-[11px] font-semibold text-gray-900 mt-1.5">Sent</span>
          </div>

          {/* Step 2: Preparing */}
          <div className="flex flex-col items-center bg-white px-2">
            <div className="w-7 h-7 rounded-full bg-emerald-50 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center animate-pulse">
              <Zap size={12} className="text-emerald-600 fill-emerald-600" />
            </div>
            <span className="text-[11px] font-black text-emerald-600 mt-1.5">Preparing</span>
          </div>

          {/* Step 3: Ready */}
          <div className="flex flex-col items-center bg-white px-2">
            <div className="w-7 h-7 rounded-full bg-white border-2 border-gray-200 text-gray-400 flex items-center justify-center text-[10px] font-semibold">
              3
            </div>
            <span className="text-[11px] font-semibold text-gray-400 mt-1.5">Ready</span>
          </div>
        </div>
      </div>

      {/* 4. Pay-On-Pickup Token Box */}
      <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-3.5 text-left shadow-2xs mb-5">
        <div className="flex items-start gap-2.5">
          <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider">
              Pay at Counter
            </h4>
            <p className="text-[11px] text-amber-900 font-normal mt-0.5 leading-relaxed">
              Show this token to the manager on arrival. Settle the bill of <span className="font-black text-gray-950 text-xs">₹{totalPrice}</span> at the counter via Cash or UPI QR.
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
          Cancel
        </button>
        <button 
          type="button"
          onClick={onClose}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-black py-3 rounded-xl shadow-xs transition-all cursor-pointer"
        >
          Done · View Orders
        </button>
      </div>

    </div>
  );
};

export default OrderStatusTracker;
