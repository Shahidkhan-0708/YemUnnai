import { SvgScreenFrame } from './SvgScreenFrame';
﻿import { Navigation, Bell, MapPin } from 'lucide-react';
interface Props { onAllow?: () => void; onManual?: () => void; }
export function LocationPermissionScreen({ onAllow, onManual }: Props) {
  return <SvgScreenFrame screen={'location'}><section className="location-screen"><div className="location-card pickup-sheet">
    <div className="sheet-handle"/><h1 className="sheet-title">Use your location</h1><p className="sheet-subtitle">See walking directions to each canteen<br/>and get updates when your order is ready.</p>
    <svg className="location-map" viewBox="0 0 336 160" role="img" aria-label="Campus map showing Library, Main block, and MITS Canteen"><rect width="336" height="160" rx="12" fill="#E8ECEF"/><rect x="20" y="18" width="72" height="36" rx="6" fill="white"/><rect x="20" y="102" width="90" height="36" rx="6" fill="white"/><rect x="186" y="30" width="130" height="56" rx="6" fill="white"/><path d="M88 84H146V58H186" fill="none" stroke="#10B981" strokeWidth="2"/><text x="56" y="41" textAnchor="middle">Library</text><text x="65" y="124" textAnchor="middle">Main block</text><text x="251" y="53" textAnchor="middle">MITS Canteen</text><text x="251" y="71" textAnchor="middle">2 min · 160 m</text><circle cx="88" cy="84" r="6" fill="#F06A05"/><circle cx="88" cy="84" r="2" fill="white"/></svg>
    <div className="location-features"><div><Navigation/><section><h2>Walking directions</h2><p>Distances from where you are.</p></section></div><div><Bell/><section><h2>Order updates</h2><p>Know when your food is ready.</p></section></div><p className="location-privacy"><MapPin/>Your location is used while the app is open.</p></div>
    <button type="button" className="location-allow" onClick={onAllow}>Use my location</button><button type="button" className="location-manual" onClick={onManual}>Set campus manually</button>
  </div></section></SvgScreenFrame>;
}
