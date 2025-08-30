import { Injectable } from '@nestjs/common';
import { SearchService } from '../../search/services/search.service';

@Injectable()
export class GeocodeService {
  constructor(private readonly searchService: SearchService) {}

  async reverseGeocode(
    lat: number,
    lng: number,
  ): Promise<{ locationName: string }> {
    // Round coordinates to 2 decimal places for consistency
    const roundedLat = Math.round(lat * 100) / 100;
    const roundedLng = Math.round(lng * 100) / 100;

    // Use the existing search service to get location name
    const query = `${roundedLat},${roundedLng}`;
    const results = await this.searchService.searchLocation(query);

    if (results && results.length > 0) {
      const location = results[0];
      // Format the location name
      let locationName = location.name;
      if (location.state) {
        locationName += `, ${location.state}`;
      }
      if (location.country) {
        locationName += `, ${location.country}`;
      }
      return { locationName };
    }

    // Return coordinates as fallback
    return { locationName: `${roundedLat}°, ${roundedLng}°` };
  }
}
