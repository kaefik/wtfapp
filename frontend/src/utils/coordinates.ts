export function isValidCoordinate(lat: number, lon: number): boolean {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180
}

export function parseCoordinate(value: string): number | null {
  const num = parseFloat(value)
  return isNaN(num) ? null : num
}

export function formatCoordinate(coord: number, decimals = 6): string {
  return coord.toFixed(decimals)
}
