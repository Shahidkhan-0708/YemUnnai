import { useEffect, useRef, useState } from 'react';
import { MapPin, LocateFixed, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useModalA11y } from '../lib/useModalA11y';
import { useShops } from '../lib/hooks';
import { updateVendorLocation } from '../lib/api';
import { shopCoordinates } from '../lib/mapLocations';
interface Props { vendorId: string; }
export function VendorLocationSettings({ vendorId }: Props) {
  const { shops, loading, error, retry } = useShops();
  const shop = shops.find(s => s.id === vendorId);
  const confirmed = shop && shopCoordinates(shop);
  const [editing, setEditing] = useState(false), [saved, setSaved] = useState(false);
  const [lat, setLat] = useState(''), [lng, setLng] = useState(''), [landmark, setLandmark] = useState('');
  const [onCampus, setOnCampus] = useState(true), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const lock = useRef(false), mounted = useRef(true), initialized = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (shop && !initialized.current) {
      initialized.current = true; setLandmark(shop.locationLandmark ?? ''); setOnCampus(shop.isOnCampus !== false);
      if (confirmed) { setLat(String(confirmed[0])); setLng(String(confirmed[1])); }
    }
  }, [shop, confirmed]);
  const needsPin = !loading && !error && !confirmed && !saved;
  const close = () => { if (!lock.current) setEditing(false); };
  const modalRef = useModalA11y<HTMLDivElement>(editing, close);
  const useLocation = () => {
    if (lock.current) return;
    if (!navigator.geolocation) { setMessage('Location is unavailable here. Enter the coordinates instead.'); return; }
    lock.current = true; setBusy(true); setMessage('');
    navigator.geolocation.getCurrentPosition(position => {
      if (mounted.current) { setLat(position.coords.latitude.toFixed(7)); setLng(position.coords.longitude.toFixed(7)); setMessage(`Location captured (accuracy about ${Math.round(position.coords.accuracy)} m). Check that the pin is at your canteen before saving.`); setBusy(false); }
      lock.current = false;
    }, () => { if (mounted.current) { setBusy(false); setMessage('Location permission was unavailable. Enter the coordinates instead.'); } lock.current = false; }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (lock.current) return;
    if (!lat.trim() || !lng.trim()) { setMessage('Enter both latitude and longitude.'); return; }
    const latitude = Number(lat), longitude = Number(lng);
    if (!shopCoordinates({ latitude, longitude, isOnCampus: onCampus })) { setMessage('Check the coordinates. On-campus canteens must be inside the MITS campus area.'); return; }
    lock.current = true; setBusy(true); setMessage('');
    try { await updateVendorLocation(vendorId, { latitude, longitude, landmark: landmark.trim(), isOnCampus: onCampus }); if (mounted.current) { setSaved(true); setMessage('Location saved. Customers will see your canteen pin on the map.'); } }
    catch { if (mounted.current) setMessage('Could not save the location. Your previous pin is unchanged. Please retry.'); }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  };
  return <><button type="button" className="vendor-location-trigger" aria-label="Canteen location settings" title="Canteen location" aria-haspopup="dialog" aria-expanded={editing} onClick={() => { setEditing(true); setMessage(''); }}><MapPin size={17} strokeWidth={1.7} aria-hidden="true"/></button>
    {editing && createPortal(<div className="canteen-map-backdrop" onClick={close}>
    <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="vendor-location-title" className="vendor-location-card vendor-location-sheet" onClick={e => e.stopPropagation()}>
    <div className="sheet-handle"/>
    <div className="vendor-location-heading"><div><h2 id="vendor-location-title">Canteen location</h2><p>{needsPin ? 'Add your map pin so customers can find your counter.' : 'Your map pin helps customers find your counter.'}</p></div><button type="button" className="vendor-location-close" aria-label="Close location settings" disabled={busy} onClick={close}><X size={18}/></button></div>
    {error && <p role="status">Could not check the saved location. <button type="button" onClick={retry}>Retry</button></p>}
    <form onSubmit={e => void submit(e)}>
      <button type="button" className="vendor-location-current" disabled={busy} onClick={useLocation}><LocateFixed size={17}/>Use my location at the canteen</button>
      <div className="vendor-location-fields"><label>Latitude<input aria-label="Canteen latitude" inputMode="decimal" type="number" step="any" min="-90" max="90" placeholder="13.62985" value={lat} disabled={busy} onChange={e => setLat(e.target.value)}/></label><label>Longitude<input aria-label="Canteen longitude" inputMode="decimal" type="number" step="any" min="-180" max="180" placeholder="78.47859" value={lng} disabled={busy} onChange={e => setLng(e.target.value)}/></label></div>
      <label className="vendor-location-landmark">Landmark<input aria-label="Canteen landmark" maxLength={160} placeholder="e.g. Beside the library entrance" value={landmark} disabled={busy} onChange={e => setLandmark(e.target.value)}/></label>
      <label className="vendor-location-campus"><input type="checkbox" checked={onCampus} disabled={busy} onChange={e => setOnCampus(e.target.checked)}/>Inside MITS campus</label>
      <div className="vendor-location-actions"><button type="submit" disabled={busy || loading || !!error}>{busy ? 'Saving…' : 'Save location'}</button><button type="button" disabled={busy} onClick={close}>{saved ? 'Done' : 'Cancel'}</button></div>
    </form>
    {message && <p role="status" className="vendor-location-message">{message}</p>}
    </div></div>, document.body)}</>;
}
