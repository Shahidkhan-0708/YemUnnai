
// Published MITS campus coordinates
export const MITS_CAMPUS: [number, number] = [13.6298529, 78.4785927];

export const DEFAULT_SHOP_COORDINATES: Record<string, [number, number]> = {
  'MITS Canteen': [13.62955, 78.47895],
  'MITS Cafe': [13.63015, 78.47835],
  'MITS Hub': [13.63050, 78.47910],
  'Happy Tea': [13.62910, 78.47810],
  'ACS Cafe': [13.62880, 78.47940],
  'Chai Victoria': [13.62880, 78.47940],
  'Pizza And Pasta (P2)': [13.62820, 78.47760],
  'Paradise': [13.62760, 78.47690],
  'Mallikarjuna Mess': [13.62710, 78.47620]
};

export function shopCoordinates(shop: {
  name?: string;
  latitude?: number | null;
  longitude?: number | null;
  isOnCampus?: boolean;
}): [number, number] | null {
  const { latitude: lat, longitude: lng, name } = shop;
  if (typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && lat !== 0) {
    return [lat, lng];
  }
  return (name ? DEFAULT_SHOP_COORDINATES[name] : null) ?? null;
}
