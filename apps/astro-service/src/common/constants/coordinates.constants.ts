/**
 * Chart type and a small fallback map for city coordinates.
 * Unknown cities are resolved via OpenStreetMap Nominatim (see coordinates.util).
 */

export enum ChartType {
  NorthIndian = 'north-indian',
  SouthIndian = 'south-indian',
  EastIndian = 'east-indian',
}

/** Default when city is empty or geocoding fails (Delhi). */
export const DEFAULT_COORDINATES = { lat: 28.6139, lng: 77.209 };

/**
 * Fallback for common cities – used for instant lookup without an external request.
 * For other places, we use OpenStreetMap Nominatim (free, no API key).
 */
export const FALLBACK_CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  mumbai: { lat: 19.076, lng: 72.8777 },
  delhi: { lat: 28.6139, lng: 77.209 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  hyderabad: { lat: 17.385, lng: 78.4867 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  pune: { lat: 18.5204, lng: 73.8567 },
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  lucknow: { lat: 26.8467, lng: 80.9462 },
  nagpur: { lat: 21.1458, lng: 79.0882 },
  indore: { lat: 22.7196, lng: 75.8577 },
  bhopal: { lat: 23.2599, lng: 77.4126 },
  patna: { lat: 25.5941, lng: 85.1376 },
  chandigarh: { lat: 30.7333, lng: 76.7794 },
  kochi: { lat: 9.9312, lng: 76.2673 },
  coimbatore: { lat: 11.0168, lng: 76.9558 },
  guwahati: { lat: 26.1445, lng: 91.7362 },
  bhubaneswar: { lat: 20.2961, lng: 85.8245 },
  dehradun: { lat: 30.3165, lng: 78.0322 },
  varanasi: { lat: 25.3176, lng: 82.9739 },
  srinagar: { lat: 34.0837, lng: 74.7973 },
  amritsar: { lat: 31.634, lng: 74.8723 },
  newyork: { lat: 40.7128, lng: -74.006 },
  london: { lat: 51.5074, lng: -0.1278 },
  singapore: { lat: 1.3521, lng: 103.8198 },
  dubai: { lat: 25.2048, lng: 55.2708 },
};

/** Default place suggestions when search query is empty (shown on focus). Fetched from Nominatim when user types. */
export const DEFAULT_PLACE_SUGGESTIONS: Array<{ displayName: string; lat: number; lng: number }> = [
  { displayName: 'Mumbai, Maharashtra, India', lat: 19.076, lng: 72.8777 },
  { displayName: 'Delhi, India', lat: 28.6139, lng: 77.209 },
  { displayName: 'Bangalore, Karnataka, India', lat: 12.9716, lng: 77.5946 },
  { displayName: 'Hyderabad, Telangana, India', lat: 17.385, lng: 78.4867 },
  { displayName: 'Chennai, Tamil Nadu, India', lat: 13.0827, lng: 80.2707 },
  { displayName: 'Kolkata, West Bengal, India', lat: 22.5726, lng: 88.3639 },
  { displayName: 'Pune, Maharashtra, India', lat: 18.5204, lng: 73.8567 },
  { displayName: 'Ahmedabad, Gujarat, India', lat: 23.0225, lng: 72.5714 },
  { displayName: 'Jaipur, Rajasthan, India', lat: 26.9124, lng: 75.7873 },
  { displayName: 'Kochi, Kerala, India', lat: 9.9312, lng: 76.2673 },
  { displayName: 'London, England, United Kingdom', lat: 51.5074, lng: -0.1278 },
  { displayName: 'Dubai, UAE', lat: 25.2048, lng: 55.2708 },
  { displayName: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { displayName: 'New York, NY, USA', lat: 40.7128, lng: -74.006 },
];
