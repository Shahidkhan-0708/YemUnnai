import { useEffect, useRef, useState } from 'react';
import { MapPin, LocateFixed } from 'lucide-react';
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
  const formOpen = editing || needsPin;
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
    try { await updateVendorLocation(vendorId, { latitude, longitude, landmark: landmark.trim(), isOnCampus: onCampus }); if (mounted.current) { setSaved(true); setEditing(false); setMessage('Location saved. Your logo pin now updates on the customer map.'); } }
    catch { if (mounted.current) setMessage('Could not save the location. Your previous pin is unchanged. Please retry.'); }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  };
  return <section className="vendor-location-card" aria-label="Canteen map location">
    <div className="vendor-location-heading"><MapPin size={20}/><div><h2>{needsPin ? 'Put your canteen on the map' : 'Canteen location'}</h2><p>{needsPin ? 'Add an accurate pin so customers can find your logo on the map.' : 'Keep your map pin and landmark up to date.'}</p></div>{!formOpen && <button type="button" disabled={loading} onClick={() => { setEditing(true); setMessage(''); }}>Edit location</button>}</div>
    {error && <p role="status">Could not check the saved location. <button type="button" onClick={retry}>Retry</button></p>}
    {formOpen && <form onSubmit={e => void submit(e)}>
      <button type="button" className="vendor-location-current" disabled={busy} onClick={useLocation}><LocateFixed size={17}/>Use my location at the canteen</button>
      <div className="vendor-location-fields"><label>Latitude<input aria-label="Canteen latitude" inputMode="decimal" type="number" step="any" min="-90" max="90" placeholder="13.62985" value={lat} disabled={busy} onChange={e => setLat(e.target.value)}/></label><label>Longitude<input aria-label="Canteen longitude" inputMode="decimal" type="number" step="any" min="-180" max="180" placeholder="78.47859" value={lng} disabled={busy} onChange={e => setLng(e.target.value)}/></label></div>
      <label className="vendor-location-landmark">Landmark<input aria-label="Canteen landmark" maxLength={160} placeholder="e.g. Beside the library entrance" value={landmark} disabled={busy} onChange={e => setLandmark(e.target.value)}/></label>
      <label className="vendor-location-campus"><input type="checkbox" checked={onCampus} disabled={busy} onChange={e => setOnCampus(e.target.checked)}/>Inside MITS campus</label>
      <div className="vendor-location-actions"><button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save map location'}</button>{editing && <button type="button" disabled={busy} onClick={() => setEditing(false)}>Cancel</button>}</div>
    </form>}
    {message && <p role="status" className="vendor-location-message">{message}</p>}
  </section>;
}
