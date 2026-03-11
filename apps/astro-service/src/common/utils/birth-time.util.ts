/**
 * Parse date of birth and birth time strings into numeric components.
 * Interpreted as local time at the birth place (for use with timezone offset).
 */
export function parseBirthDateTime(
  dob: string,
  birthTime: string,
): { year: number; month: number; day: number; hour: number; minute: number; second: number } {
  const [y, m, d] = dob.split('-').map(Number);
  const parts = birthTime.trim().split(':');
  const hour = Number(parts[0]) || 0;
  const minute = Number(parts[1]) || 0;
  const second = Number(parts[2]) || 0;
  return { year: y, month: m, day: d, hour, minute, second };
}

/**
 * Approximate timezone offset in hours (east of UTC) from longitude.
 * Used to interpret birth time as local time at the birth place.
 */
export function getTimezoneOffsetFromLongitude(longitude: number): number {
  return longitude / 15;
}
