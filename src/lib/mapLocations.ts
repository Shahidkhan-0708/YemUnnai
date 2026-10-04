import type { ShopEntry } from './types';
// Published MITS campus coordinates; an unconfirmed canteen never inherits this pin.
export const MITS_CAMPUS: [number, number] = [13.6298529, 78.4785927];
export function shopCoordinates(shop: Pick<ShopEntry, 'latitude' | 'longitude' | 'isOnCampus'>): [number, number] | null {
  const { latitude: lat, longitude: lng } = shop;
  if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  const legacyPins = [[13.6289, 78.5022], [13.56102, 78.49781], [13.56031, 78.49863], [13.55987, 78.49622], [13.56066, 78.49951]];
  if (legacyPins.some(([oldLat, oldLng]) => Math.abs(lat - oldLat) < 0.0000001 && Math.abs(lng - oldLng) < 0.0000001)) return null;
  // Reject the old seed pins outside campus; off-campus outlets may be farther away.
  const km = Math.hypot((lat - MITS_CAMPUS[0]) * 111.2, (lng - MITS_CAMPUS[1]) * 108.1);
  return shop.isOnCampus !== false && km > 1.5 ? null : [lat, lng];
}
