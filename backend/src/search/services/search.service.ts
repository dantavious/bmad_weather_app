import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { LocationSearchResult } from '@shared/models/location.model';
import {
  GeocodingApiResponse,
  ZipCodeApiResponse,
} from '@shared/models/api-responses.model';
import { CacheService } from '../../weather/services/cache.service';
import { CacheKeys } from '@shared/utils/cache-keys.util';
import { sanitizeSearchQuery } from '@shared/utils/sanitize.util';

@Injectable()
export class SearchService {
  private readonly apiKey: string;
  private readonly geoBaseUrl = 'https://api.openweathermap.org/geo/1.0';
  private readonly CACHE_TTL = 24 * 60 * 60; // 24 hours in seconds
  private readonly REQUEST_TIMEOUT = 5000; // 5 seconds timeout

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private cacheService: CacheService,
  ) {
    this.apiKey = this.configService.get<string>('openweather.apiKey', '');
    if (!this.apiKey) {
      throw new Error('OPENWEATHER_API_KEY is required');
    }
  }

  async searchLocation(query: string): Promise<LocationSearchResult[]> {
    // Sanitize the query to prevent injection attacks
    const sanitizedQuery = sanitizeSearchQuery(query);

    if (!sanitizedQuery || sanitizedQuery.length < 3) {
      return [];
    }

    const cacheKey = CacheKeys.locationSearch(sanitizedQuery);

    // Check cache first
    const cached = this.cacheService.get<LocationSearchResult[]>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    try {
      let results: LocationSearchResult[] = [];

      // Check if query is a ZIP code (5 digits or ZIP+4 format)
      const zipCodePattern = /^(\d{5})(-\d{4})?$/;
      if (zipCodePattern.test(sanitizedQuery)) {
        results = await this.searchByZipCode(sanitizedQuery);
      }
      // Check if query is coordinates (lat,lon format)
      else if (this.isCoordinatesQuery(sanitizedQuery)) {
        results = await this.searchByCoordinates(sanitizedQuery);
      }
      // Otherwise, search by city name
      else {
        results = await this.searchByCityName(sanitizedQuery);
      }

      // Cache the results
      this.cacheService.set(cacheKey, results, this.CACHE_TTL);

      return results;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  private async searchByCityName(
    cityName: string,
  ): Promise<LocationSearchResult[]> {
    const url = `${this.geoBaseUrl}/direct`;

    try {
      const response = await firstValueFrom(
        this.httpService.get<GeocodingApiResponse[]>(url, {
          params: {
            q: cityName,
            limit: 5,
            appid: this.apiKey,
          },
          timeout: this.REQUEST_TIMEOUT,
        }),
      );

      return this.mapGeocodingResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  private async searchByZipCode(
    zipCode: string,
  ): Promise<LocationSearchResult[]> {
    const url = `${this.geoBaseUrl}/zip`;

    try {
      const response = await firstValueFrom(
        this.httpService.get<ZipCodeApiResponse>(url, {
          params: {
            zip: zipCode,
            appid: this.apiKey,
          },
          timeout: this.REQUEST_TIMEOUT,
        }),
      );

      // Zip code API returns a single result, not an array
      return response.data
        ? [this.mapSingleGeocodingResult(response.data)]
        : [];
    } catch (error) {
      // If ZIP code not found, return empty array
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  }

  private async searchByCoordinates(
    query: string,
  ): Promise<LocationSearchResult[]> {
    const coords = this.parseCoordinates(query);
    if (!coords) {
      return [];
    }

    const url = `${this.geoBaseUrl}/reverse`;

    try {
      const response = await firstValueFrom(
        this.httpService.get<GeocodingApiResponse[]>(url, {
          params: {
            lat: coords.lat,
            lon: coords.lon,
            limit: 1,
            appid: this.apiKey,
          },
          timeout: this.REQUEST_TIMEOUT,
        }),
      );

      return this.mapGeocodingResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  private isCoordinatesQuery(query: string): boolean {
    // Check for comma-separated coordinates (e.g., "40.7128,-74.0060")
    const coordsPattern = /^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/;
    return coordsPattern.test(query);
  }

  private parseCoordinates(query: string): { lat: number; lon: number } | null {
    const parts = query.split(',').map((s) => s.trim());
    if (parts.length !== 2) {
      return null;
    }

    const lat = parseFloat(parts[0]);
    const lon = parseFloat(parts[1]);

    if (
      isNaN(lat) ||
      isNaN(lon) ||
      lat < -90 ||
      lat > 90 ||
      lon < -180 ||
      lon > 180
    ) {
      return null;
    }

    return { lat, lon };
  }

  private mapGeocodingResponse(
    data: GeocodingApiResponse[],
  ): LocationSearchResult[] {
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((item) => this.mapSingleGeocodingResult(item));
  }

  private mapSingleGeocodingResult(
    item: GeocodingApiResponse | ZipCodeApiResponse,
  ): LocationSearchResult {
    return {
      name: item.name || '',
      country: item.country || '',
      state: 'state' in item ? item.state : undefined,
      lat: Number((item.lat || 0).toFixed(2)),
      lon: Number((item.lon || 0).toFixed(2)),
    };
  }

  private handleApiError(error: any): never {
    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new HttpException(
        'Request timeout - search took too long',
        HttpStatus.REQUEST_TIMEOUT,
      );
    }

    if (error.response) {
      const status = error.response.status;

      switch (status) {
        case 401:
          throw new HttpException(
            'Invalid or missing OpenWeather API key',
            HttpStatus.UNAUTHORIZED,
          );
        case 404:
          throw new HttpException('Location not found', HttpStatus.NOT_FOUND);
        case 429:
          throw new HttpException(
            'API rate limit exceeded',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        default:
          throw new HttpException(
            'Failed to search location',
            HttpStatus.SERVICE_UNAVAILABLE,
          );
      }
    }

    throw new HttpException(
      'Failed to search location',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
