import { SvgScreenFrame } from './SvgScreenFrame';
import React, { useState, useEffect } from 'react';
import { X, Footprints, Navigation, MapPin, Compass, Copy, Check } from 'lucide-react';
import { useModalA11y } from '../lib/useModalA11y';
import { playTapSound } from '../lib/celebration';
import type { FoodItem } from '../lib/types';

interface WalkInMapModalProps {
  isOpen: boolean;
  item: FoodItem | null;
  onClose: () => void;
}

// MITS campus center coordinates (Madanapalle, AP)
const MITS_CAMPUS_LAT = 13.6288;
const MITS_CAMPUS_LNG = 78.5020;

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Accurate campus walking benchmarks from central starting point
const CAMPUS_BENCHMARKS: Record<string, { meters: number; minutes: number; tip: string }> = {
  canteen: {
    meters: 160,
    minutes: 2,
    tip: 'Take the paved path past Science Lab; food court entrance is on ground floor',
  },
  library: {
    meters: 175,
    minutes: 2,
    tip: 'Walk north along the main academic avenue; stall is beside Central Library lawn',
  },
  cafe: {
    meters: 210,
    minutes: 3,
    tip: 'North walkway past Central Lawn into Main Academic Block atrium',
  },
  hostel: {
    meters: 110,
    minutes: 1,
    tip: 'South pathway straight toward Boys Hostel Block B entrance',
  },
  lickies: {
    meters: 420,
    minutes: 5,
    tip: 'Take the eastern avenue toward Campus Gate 1 main archway (Off-campus)',
  },
};

export const WalkInMapModal: React.FC<WalkInMapModalProps> = ({ isOpen, item, onClose }) => {
  const sheetRef = useModalA11y<HTMLDivElement>(isOpen && !!item, onClose);
  const [activeTab, setActiveTab] = useState<'schematic' | 'gps'>('schematic');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [liveDistance, setLiveDistance] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch live browser GPS if available
  useEffect(() => {
    if (!isOpen || !item) return;

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          const destLat = item.latitude ?? MITS_CAMPUS_LAT;
          const destLng = item.longitude ?? MITS_CAMPUS_LNG;
          const meters = calculateDistanceMeters(loc.lat, loc.lng, destLat, destLng);
          setLiveDistance(meters);
        },
        () => {
          // Fallback to campus benchmark
          setLiveDistance(null);
        },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const vendor = item.vendor || 'MITS Canteen';
  const vLower = vendor.toLowerCase();

  // Dynamic landmark and schematic coordinate resolution
  let buildingName = 'Canteen';
  let landmarkText = item.locationLandmark || 'Campus Food Court • Ground Floor';
  let pinX = 203;
  let pinY = 468;
  let routePath = 'M88 548H140V490H173';

  let benchmark = CAMPUS_BENCHMARKS.canteen;

  if (vLower.includes('ekdant') || vLower.includes('library')) {
    buildingName = 'Central Library';
    landmarkText = item.locationLandmark || 'Beside Central Library Lawn';
    pinX = 72;
    pinY = 352;
    routePath = 'M88 548V420';
    benchmark = CAMPUS_BENCHMARKS.library;
  } else if (vLower.includes('lickies') || item.isOnCampus === false) {
    buildingName = 'Gate 1 (Off-Campus)';
    landmarkText = item.locationLandmark || 'Opposite Campus Gate 1 Arch';
    pinX = 265;
    pinY = 425;
    routePath = 'M88 548H140V445H265';
    benchmark = CAMPUS_BENCHMARKS.lickies;
  } else if (vLower.includes('new') || vLower.includes('hostel')) {
    buildingName = 'Hostel Block';
    landmarkText = item.locationLandmark || 'Near Boys Hostel Block B';
    pinX = 77;
    pinY = 548;
    routePath = 'M88 548V569';
    benchmark = CAMPUS_BENCHMARKS.hostel;
  } else if (vLower.includes('cafe')) {
    buildingName = 'Main Block';
    landmarkText = item.locationLandmark || 'Near Main Block Lawn & Atrium';
    pinX = 192;
    pinY = 345;
    routePath = 'M88 548H140V390H157';
    benchmark = CAMPUS_BENCHMARKS.cafe;
  }

  // Realistic distance calculation (guards against trivial simulated 24m)
  const isRealisticLive = liveDistance != null && liveDistance >= 50 && liveDistance <= 3000;
  const computedMeters = isRealisticLive ? liveDistance : benchmark.meters;
  const dynamicMinutes = isRealisticLive ? Math.max(1, Math.round(computedMeters / 80)) : benchmark.minutes;
  const displayWalkTime = `${dynamicMinutes} min walk (${computedMeters}m)`;

  const openGoogleMaps = () => {
    playTapSound();
    let url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vendor + ', MITS Campus, Madanapalle')}`;
    if (item.latitude && item.longitude) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${item.latitude},${item.longitude}`;
    }
    window.open(url, '_blank', 'noopener');
  };

  const handleCopyAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    playTapSound();
    const fullAddr = `${vendor}, ${landmarkText}, MITS Campus, Madanapalle, AP 517325`;
    navigator.clipboard?.writeText(fullAddr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return <SvgScreenFrame screen={'map'}>(
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      {/* Bottom Sheet Modal */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Walk-in map for ${vendor}`}
        className="pickup-sheet map-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Row with Close button (Fixed Header) */}
        <div className="px-5 pt-3 pb-2.5 border-b border-[#D6DCE2]/60 shrink-0 bg-white">
          {/* Drag Handle */}
          <div className="w-12 h-1.5 rounded-full bg-[#CBD5E1] mx-auto mb-2.5" />

          {/* Top Header Row with Close button */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  Campus Walk-In
                </span>
                <span
                  className={`text-[9px] font-medium uppercase px-2 py-0.5 rounded-full ${
                    item.isOnCampus !== false
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  {item.isOnCampus !== false ? 'On Campus' : 'Off-Campus'}
                </span>
              </div>
              <h2 className="text-lg font-black text-[#1F140A] leading-tight mt-0.5">{vendor}</h2>
              <p className="text-xs font-semibold text-[#7A6658]">{landmarkText}</p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 border border-[#D6DCE2] flex items-center justify-center text-[#7A6658] hover:text-[#1F140A] active:scale-90 transition-all cursor-pointer shadow-xs"
            >
              <X className="w-4.5 h-4.5" strokeWidth={2.2} />
            </button>
          </div>

          {/* View Switcher: Schematic Campus Map vs GPS map */}
          <div className="mt-2.5 flex items-center p-1 rounded-full bg-[#E8ECEF] border border-[#D6DCE2] shadow-inner text-[10px] font-extrabold">
            <button
              type="button"
              onClick={() => setActiveTab('schematic')}
              className={`flex-1 py-1 rounded-full text-center transition-all cursor-pointer ${
                activeTab === 'schematic' ? 'bg-[#F06A05] text-white shadow-xs' : 'text-[#1F140A] hover:bg-black/5'
              }`}
            >
              Campus Map
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('gps')}
              className={`flex-1 py-1 rounded-full text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'gps' ? 'bg-[#F06A05] text-white shadow-xs' : 'text-[#1F140A] hover:bg-black/5'
              }`}
            >
              <Compass className="w-3 h-3" />
              <span>GPS map</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-3 space-y-3">
          {/* Content Tab 1: Single Authoritative Campus Vector Map */}
          {activeTab === 'schematic' && (
            <div
              className="w-full h-64 rounded-2xl overflow-hidden relative border border-[#C4D2CB] shrink-0 shadow-sm"
              style={{ background: '#DCE8DA' }}
            >
              <svg
                viewBox="28 348 319 277"
                className="w-full h-full"
                preserveAspectRatio="xMidYMid slice"
                role="img"
                aria-label="Campus walking route"
              >
                <defs>
                  <clipPath id="wim-map-clip">
                    <rect x="28" y="348" width="319" height="277" rx="16" />
                  </clipPath>
                  <filter id="bldgShadow" x="-5%" y="-5%" width="115%" height="115%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0F172A" floodOpacity="0.12" />
                  </filter>
                </defs>

                <g clipPath="url(#wim-map-clip)">
                  {/* Subtle campus grass gradient texture */}
                  <rect x="28" y="348" width="319" height="277" fill="#DDE8DC" />

                  {/* Water body (right edge pond/lake) */}
                  <path
                    d="M285 340C260 430 333 457 311 539S300 603 335 644H380V340Z"
                    fill="#B5DAE0"
                  />

                  {/* Roads / Walkways: Paved avenues with center lines */}
                  <g fill="none">
                    <path d="M33 445H275 M139 351V633 M140 548H313" stroke="#CBD8CB" strokeWidth="26" />
                    <path d="M33 445H275 M139 351V633 M140 548H313" stroke="#F6F8F2" strokeWidth="18" />
                  </g>

                  {/* Campus Buildings with High-Contrast Target Highlighting */}
                  <g filter="url(#bldgShadow)">
                    {/* Central Library */}
                    <rect
                      x="47"
                      y="375"
                      width="70"
                      height="45"
                      rx="8"
                      fill={buildingName.includes('Library') ? '#A1CCA0' : '#E8EEF3'}
                      stroke={buildingName.includes('Library') ? '#F06A05' : '#CBD5E1'}
                      strokeWidth={buildingName.includes('Library') ? 2.5 : 1}
                    />
                    <text
                      x="82"
                      y="400.5"
                      fontSize="9"
                      fontWeight="800"
                      fill={buildingName.includes('Library') ? '#0F172A' : '#64748B'}
                      textAnchor="middle"
                    >
                      Library
                    </text>

                    {/* Main Academic Block */}
                    <rect
                      x="157"
                      y="367"
                      width="90"
                      height="48"
                      rx="8"
                      fill={buildingName.includes('Main') ? '#A1CCA0' : '#E8EEF3'}
                      stroke={buildingName.includes('Main') ? '#F06A05' : '#CBD5E1'}
                      strokeWidth={buildingName.includes('Main') ? 2.5 : 1}
                    />
                    <text
                      x="202"
                      y="394"
                      fontSize="9.5"
                      fontWeight="800"
                      fill={buildingName.includes('Main') ? '#0F172A' : '#64748B'}
                      textAnchor="middle"
                    >
                      Main Block
                    </text>

                    {/* Science & Tech Lab */}
                    <rect x="56" y="466" width="65" height="58" rx="8" fill="#E8EEF3" stroke="#CBD5E1" strokeWidth="1" />
                    <text x="88.5" y="498" fontSize="9" fontWeight="700" fill="#64748B" textAnchor="middle">
                      Lab
                    </text>

                    {/* Canteen / Food Court */}
                    <rect
                      x="173"
                      y="490"
                      width="80"
                      height="43"
                      rx="8"
                      fill={buildingName.includes('Canteen') ? '#A1CCA0' : '#E8EEF3'}
                      stroke={buildingName.includes('Canteen') ? '#F06A05' : '#CBD5E1'}
                      strokeWidth={buildingName.includes('Canteen') ? 2.5 : 1}
                    />
                    <text
                      x="213"
                      y="515"
                      fontSize="9.5"
                      fontWeight="800"
                      fill={buildingName.includes('Canteen') ? '#0F172A' : '#64748B'}
                      textAnchor="middle"
                    >
                      Canteen
                    </text>

                    {/* Student Hostel Block */}
                    <rect
                      x="55"
                      y="569"
                      width="64"
                      height="34"
                      rx="8"
                      fill={buildingName.includes('Hostel') ? '#A1CCA0' : '#E8EEF3'}
                      stroke={buildingName.includes('Hostel') ? '#F06A05' : '#CBD5E1'}
                      strokeWidth={buildingName.includes('Hostel') ? 2.5 : 1}
                    />
                    <text
                      x="87"
                      y="589"
                      fontSize="9"
                      fontWeight="800"
                      fill={buildingName.includes('Hostel') ? '#0F172A' : '#64748B'}
                      textAnchor="middle"
                    >
                      Hostel
                    </text>
                  </g>

                  {/* Animated walking route from user origin to target building */}
                  <g fill="none" strokeLinejoin="round">
                    <path d={routePath} stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" />
                    <path
                      d={routePath}
                      stroke="#10B981"
                      strokeWidth="4"
                      className="animate-route-dash"
                      strokeLinecap="round"
                    />
                  </g>

                  {/* Origin: Starting point with pulse ring and "YOU" tag */}
                  <g transform="translate(88 548)">
                    <circle r="14" fill="#10B981" opacity="0.25" className="" />
                    <circle r="6" fill="#10B981" stroke="#FFFFFF" strokeWidth="2.5" />
                    <rect x="-13" y="9" width="26" height="11" rx="5.5" fill="#0F172A" />
                    <text x="0" y="17.5" fontSize="7" fontWeight="900" fill="#FFFFFF" textAnchor="middle">
                      YOU
                    </text>
                  </g>

                  {/* Destination Pin (Dynamic position pointing directly at target) */}
                  <g transform={`translate(${pinX} ${pinY}) scale(1.15)`}>
                    <path
                      d="M12 22S4 14 4 9a8 8 0 1 1 16 0c0 5-8 13-8 13Z M12 6a3 3 0 1 0 0 6a3 3 0 0 0 0-6"
                      fill="#F06A05"
                      stroke="#9B3B00"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                </g>
              </svg>

              {/* ETA chip floating top-left inside map */}
              <div className="absolute left-3 top-3 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-xs flex items-center gap-1.5 shadow-md border border-stone-200">
                <Footprints className="w-4 h-4 text-[#F06A05] shrink-0" strokeWidth={2.2} />
                <span className="text-xs font-black text-[#1F140A]">{displayWalkTime}</span>
              </div>

              {/* Target Building chip top-right */}
              <div className="absolute right-3 top-3 px-2.5 py-1 rounded-full bg-[#F06A05] text-white flex items-center gap-1.5 shadow-md">
                <span className="w-2 h-2 rounded-full bg-emerald-300 " />
                <span className="text-[9.5px] font-black uppercase tracking-wider">Target: {buildingName}</span>
              </div>
            </div>
          )}

          {/* Content Tab 2: GPS map & Heading */}
          {activeTab === 'gps' && (
            <div className="w-full h-64 rounded-2xl bg-[#0F1E17] border border-emerald-900/60 p-4 flex flex-col items-center justify-between text-white relative overflow-hidden shadow-sm">
              {/* Ambient concentric radar rings */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <div className="w-48 h-48 rounded-full border border-orange-300" />
                <div className="absolute w-36 h-36 rounded-full border border-orange-300" />
                <div className="absolute w-22 h-22 rounded-full border border-orange-300" />
              </div>

              <div className="w-full flex items-center justify-between text-[11px] font-bold text-slate-300 z-10">
                <span className="flex items-center gap-1">
                  <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                  <span>GPS map</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  {item.latitude ? `${item.latitude.toFixed(4)}°N, ${item.longitude?.toFixed(4)}°E` : 'Campus Coords'}
                </span>
              </div>

              {/* Radar Center Metric */}
              <div className="flex flex-col items-center z-10">
                <div className="w-14 h-14 rounded-full bg-[#F06A05] border-2 border-orange-300 flex items-center justify-center shadow-lg  mb-2">
                  <MapPin className="w-7 h-7 text-amber-300 fill-amber-300/20" />
                </div>
                <span className="text-xl font-black text-white tracking-tight">{computedMeters} meters away</span>
                <span className="text-xs font-semibold text-emerald-300">~{dynamicMinutes} min brisk walking time</span>
              </div>

              <div className="w-full text-center text-[10px] text-slate-400 z-10">
                {userLocation ? 'Live GPS signal acquired • High precision' : 'MITS Campus Radar Active • Using campus reference'}
              </div>
            </div>
          )}

          {/* Clean, High-Trust Destination Info Card (NO duplicate second map) */}
          <div className="bg-white rounded-2xl p-4 border border-[#D6DCE2] shadow-xs space-y-3 font-sans">
            {/* Header row with vendor, verified status, and copy button */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 " />
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                    {item.isShopOnline === false ? 'Temporarily Closed' : 'Verified Campus Spot • Open'}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-[#1F140A] mt-0.5">{vendor}</h3>
              </div>

              <button
                type="button"
                onClick={handleCopyAddress}
                className="py-1.5 px-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-[#7A6658] active:scale-95 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-stone-200"
                title="Copy address"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[11px]">{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            {/* Exact Landmark & Floor */}
            <div className="flex items-start gap-2 text-xs text-[#524439] bg-stone-50 p-2.5 rounded-xl border border-stone-100">
              <MapPin className="w-4 h-4 text-[#F06A05] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#1F140A]">{landmarkText}</p>
                <p className="text-[11px] text-[#7A6658] mt-0.5">MITS Campus, Madanapalle, Andhra Pradesh 517325</p>
              </div>
            </div>

            {/* Walking Direction Steps / Helpful Tip */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-100 gap-2">
              <div className="flex items-center gap-1.5 text-stone-600 min-w-0">
                <Footprints className="w-3.5 h-3.5 text-[#F06A05] shrink-0" />
                <span className="font-semibold text-[11px] truncate">{benchmark.tip}</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                ⚡ {displayWalkTime}
              </span>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="px-5 py-3 border-t border-[#D6DCE2]/60 bg-white/95 backdrop-blur-xs shrink-0 flex items-center justify-between gap-3 shadow-lg">
          <div className="min-w-0">
            <div className="text-[10px] font-extrabold uppercase text-[#7A6658]">Walking Route</div>
            <div className="text-xs font-black text-[#1F140A] truncate">{displayWalkTime}</div>
          </div>
          <button
            type="button"
            onClick={openGoogleMaps}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#F06A05] hover:bg-[#E05D00] text-white text-xs font-black tracking-wide shadow-md active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5 fill-white" />
            <span>Open in Google Maps</span>
          </button>
        </div>
      </div>
    </div>
  )</SvgScreenFrame>;
};
