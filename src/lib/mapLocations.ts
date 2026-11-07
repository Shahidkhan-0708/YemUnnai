
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

/**
 * Calculate the great circle distance between two points using the Haversine formula.
 * @param coord1 - First coordinate as [lat, lng]
 * @param coord2 - Second coordinate as [lat, lng]
 * @returns Distance in meters
 */
export function haversineDistance(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const [lat1, lon1] = coord1;
  const [lat2, lon2] = coord2;

  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert distance in meters to a human-readable format.
 * @param meters - Distance in meters
 * @returns Human-readable string (e.g., "150m", "1.2km")
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Estimate walking time based on distance (assuming 5 km/h walking speed).
 * @param meters - Distance in meters
 * @returns Walking time string (e.g., "2 min walk", "5 min walk")
 */
export function formatWalkingTime(meters: number): string {
  const km = meters / 1000;
  const minutes = Math.round(km * 12); // 5 km/h = 12 min per km
  if (minutes <= 1) return '1 min walk';
  return `${minutes} min walk`;
}

/**
 * Check if a shop is within the specified radius from a given location.
 * @param userLocation - User's current location as [lat, lng]
 * @param shopLocation - Shop's location as [lat, lng]
 * @param radiusInMeters - Maximum distance in meters
 * @returns true if shop is within radius
 */
export function isWithinRadius(
  userLocation: [number, number],
  shopLocation: [number, number],
  radiusInMeters: number
): boolean {
  return haversineDistance(userLocation, shopLocation) <= radiusInMeters;
}
