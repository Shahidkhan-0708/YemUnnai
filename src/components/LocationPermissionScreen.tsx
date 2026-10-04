import { SvgScreenFrame } from './SvgScreenFrame';
import { CanteenMap } from './CanteenMap';
import { useShops } from '../lib/hooks';
﻿import { Navigation, Bell, MapPin } from 'lucide-react';
interface Props { onAllow?: () => void; onManual?: () => void; }
export function LocationPermissionScreen({ onAllow, onManual }: Props) {
  const { shops } = useShops();
  return <SvgScreenFrame screen={null}><section className="location-screen"><div className="location-card pickup-sheet">
    <div className="sheet-handle"/><h1 className="sheet-title">Use your location</h1><p className="sheet-subtitle">See walking directions to each canteen<br/>and get updates when your order is ready.</p>
    <CanteenMap shops={shops}/>
    <div className="location-features"><div><Navigation/><section><h2>Walking directions</h2><p>Open your walking route in Google Maps.</p></section></div><div><Bell/><section><h2>Order updates</h2><p>Know when your food is ready.</p></section></div><p className="location-privacy"><MapPin/>Your location is used while the app is open.</p></div>
    <button type="button" className="location-allow" onClick={onAllow}>Use my location</button><button type="button" className="location-manual" onClick={onManual}>Continue without location</button>
  </div></section></SvgScreenFrame>;
}
