import * as Location from 'expo-location';

const OLA_MAPS_KEY =
  process.env.EXPO_PUBLIC_OLA_MAPS_API_KEY ||
  'KMVffNGXECWx56DmBdiRQDENVw27ZiMMHw9oniBH';

export interface ReverseGeocodeResult {
  address: string;
  lat: number;
  lng: number;
  city?: string;
  pincode?: string;
}

/**
 * Reverse geocodes coordinates to a human-readable Indian street address.
 * Uses Ola Maps API as primary; expo-location reverse geocoding as fallback.
 */
export async function reverseGeocodeWithOla(
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult> {
  // 1. Try Ola Maps Reverse Geocode
  if (OLA_MAPS_KEY) {
    try {
      const url = `https://api.olamaps.io/places/v1/reverse-geocode?latlng=${lat},${lng}&api_key=${OLA_MAPS_KEY}`;
      const res = await fetch(url, { headers: { 'X-Request-Id': `dusmint-${Date.now()}` } });
      const data = await res.json();

      if (data.status === 'ok' && data.results && data.results.length > 0) {
        const top = data.results[0];
        const formatted = top.formatted_address || top.name;
        if (formatted) {
          return {
            address: formatted,
            lat,
            lng,
            city: top.address_components?.find((c: any) => c.types?.includes('locality'))?.long_name,
            pincode: top.address_components?.find((c: any) => c.types?.includes('postal_code'))?.long_name,
          };
        }
      }
    } catch (err) {
      console.warn('Ola Maps reverse geocode network blip:', err);
    }
  }

  // 2. Fallback to device / expo-location reverse geocoding
  try {
    const geo = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    if (geo && geo.length > 0) {
      const item = geo[0];
      const parts = [
        item.name,
        item.street,
        item.subregion,
        item.district,
        item.city,
        item.region,
        item.postalCode,
      ].filter(Boolean);

      const combinedAddress = Array.from(new Set(parts)).join(', ');
      return {
        address: combinedAddress || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        lat,
        lng,
        city: item.city || item.district || undefined,
        pincode: item.postalCode || undefined,
      };
    }
  } catch (err) {
    console.warn('Expo-location reverse geocode error:', err);
  }

  return {
    address: `Near Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
    lat,
    lng,
  };
}
