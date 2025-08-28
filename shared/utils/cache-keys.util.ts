export class CacheKeys {
  static weatherCurrent(lat: number, lon: number, units: string = 'imperial'): string {
    const roundedLat = Math.round(lat * 100) / 100;
    const roundedLon = Math.round(lon * 100) / 100;
    return `weather:current:${roundedLat}:${roundedLon}:${units}`;
  }

  static weatherForecast(lat: number, lon: number): string {
    const roundedLat = Math.round(lat * 100) / 100;
    const roundedLon = Math.round(lon * 100) / 100;
    return `weather:forecast:${roundedLat}:${roundedLon}`;
  }

  static weatherAlerts(lat: number, lon: number): string {
    const roundedLat = Math.round(lat * 100) / 100;
    const roundedLon = Math.round(lon * 100) / 100;
    return `weather:alerts:${roundedLat}:${roundedLon}`;
  }

  static locationSearch(query: string): string {
    return `location:search:${query.toLowerCase().trim()}`;
  }
}