import React, { useState, useEffect } from 'react';
import { Check, Clock, AlertCircle, Utensils, Zap } from 'lucide-react';

export interface OrderStatusTrackerProps {
  canteenName?: string;
  totalPrice: number;
  initialMinutes?: number;
  itemsCount?: number;
  onClose: () => void;
  onCancel?: () => void;
}

export const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({
  canteenName = 'MITS Canteen',
  totalPrice,
  initialMinutes = 5,
  itemsCount = 1,
  onClose,
  onCancel
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(initialMinutes * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden font-sans p-6 text-center animate-in fade-in zoom-in-95 duration-200">
      
      {/* 1. Header Confirmation Status */}
      <div className="flex flex-col items-center mb-5">
        <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 shadow-inner">
          <Utensils size={24} className="text-emerald-600" />
        </div>
        <h3 className="text-xl font-black text-gray-950 tracking-tight">
          Order Pushed to Kitchen!
        </h3>
        <p className="text-xs text-gray-500 font-normal mt-1">
          <span className="font-semibold text-gray-800">{canteenName}</span> owner has been alerted · {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
        </p>
      </div>

      {/* 2. Interactive Countdown Timer */}
      <div className="bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 mb-5 shadow-xs">
        <div className="flex items-center justify-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
          <Clock size={12} className="text-orange-500" />
          <span>Your Estimated Arrival</span>
        </div>
        <span className="text-4xl font-black text-orange-500 tracking-tight block font-mono">
          {formatCountdown(secondsRemaining)}
        </span>
        <p className="text-[11px] text-gray-500 font-normal mt-1">
          Walking distance: <span className="font-semibold text-gray-700">~50m</span> from campus court
        </p>
      </div>

      {/* 3. Minimalist App Step Tracker */}
      <div className="px-3 mb-6">
        <div className="flex items-center justify-between relative">
          {/* Tracker Background Connecting Line */}
          <div className="absolute left-6 right-6 top-3 h-0.5 bg-gray-100 -z-10" />
          <div className="absolute left-6 w-1/2 top-3 h-0.5 bg-emerald-500 -z-10 transition-all duration-500" />

          {/* Step 1: Sent */}
          <div className="flex flex-col items-center bg-white px-2">
            <div className="w-6.5 h-6.5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-semibold shadow-xs">
              <Check size={12} strokeWidth={3} />
            </div>
            <span className="text-[11px] font-semibold text-gray-900 mt-1.5">Sent</span>
          </div>

          {/* Step 2: Preparing */}
          <div className="flex flex-col items-center bg-white px-2">
            <div className="w-6.5 h-6.5 rounded-full bg-white border-2 border-emerald-500 text-emerald-600 flex items-center justify-center animate-pulse">
              <Zap size={11} className="text-emerald-600 fill-emerald-600" />
            </div>
            <span className="text-[11px] font-black text-emerald-600 mt-1.5">Preparing</span>
          </div>

          {/* Step 3: Ready */}
          <div className="flex flex-col items-center bg-white px-2">
            <div className="w-6.5 h-6.5 rounded-full bg-white border-2 border-gray-200 text-gray-300 flex items-center justify-center text-[10px] font-semibold">
              3
            </div>
            <span className="text-[11px] font-semibold text-gray-400 mt-1.5">Ready</span>
          </div>
        </div>
      </div>

      {/* 4. Pay-On-Pickup Token Box */}
      <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-4 text-left shadow-xs mb-5">
        <div className="flex items-start gap-2.5">
          <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-extrabold text-amber-950 uppercase tracking-wider">
              Pay at the Counter
            </h4>
            <p className="text-[11px] text-amber-900 font-medium mt-0.5 leading-relaxed">
              Show this screen to the manager on arrival. Settle the bill of <span className="font-black text-gray-950 text-xs">₹{totalPrice}</span> directly at the shop window via Cash or UPI QR.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Action Buttons Strip */}
      <div className="flex gap-2.5">
        <button 
          type="button"
          onClick={onCancel || onClose}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-3 rounded-xl transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button 
          type="button"
          onClick={onClose}
          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-extrabold py-3 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          Done · Track Walk
        </button>
      </div>

    </div>
  );
};

export default OrderStatusTracker;
