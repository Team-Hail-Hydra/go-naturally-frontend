export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}

export class GeolocationService {
  private static instance: GeolocationService;
  private cachedLocation: LocationData | null = null;
  private cacheExpiryTime = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): GeolocationService {
    if (!GeolocationService.instance) {
      GeolocationService.instance = new GeolocationService();
    }
    return GeolocationService.instance;
  }

  /**
   * Get current position using browser's geolocation API
   * @param options - Geolocation options
   * @returns Promise with location data
   */
  async getCurrentPosition(options?: PositionOptions): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject({
          code: 0,
          message: 'Geolocation is not supported by this browser'
        } as GeolocationError);
        return;
      }

      // Check if we have a valid cached location
      if (this.cachedLocation && this.isCacheValid()) {
        resolve(this.cachedLocation);
        return;
      }

      const defaultOptions: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
        ...options
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          };
          
          // Cache the location
          this.cachedLocation = locationData;
          resolve(locationData);
        },
        (error) => {
          const geolocationError: GeolocationError = {
            code: error.code,
            message: this.getErrorMessage(error.code)
          };
          reject(geolocationError);
        },
        defaultOptions
      );
    });
  }

  /**
   * Get cached location if available and valid
   */
  getCachedLocation(): LocationData | null {
    if (this.cachedLocation && this.isCacheValid()) {
      return this.cachedLocation;
    }
    return null;
  }

  /**
   * Check if geolocation is supported
   */
  isSupported(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * Clear cached location data
   */
  clearCache(): void {
    this.cachedLocation = null;
  }

  private isCacheValid(): boolean {
    if (!this.cachedLocation?.timestamp) return false;
    return Date.now() - this.cachedLocation.timestamp < this.cacheExpiryTime;
  }

  private getErrorMessage(code: number): string {
    switch (code) {
      case 1:
        return 'Location access denied by user';
      case 2:
        return 'Location unavailable';
      case 3:
        return 'Location request timed out';
      default:
        return 'An unknown error occurred while getting location';
    }
  }
}

// Export singleton instance
export const geolocationService = GeolocationService.getInstance();

/**
 * Utility hook-like function for React components
 * @param options - Geolocation options
 * @returns Promise with location data
 */
export const getCurrentLocation = (options?: PositionOptions): Promise<LocationData> => {
  return geolocationService.getCurrentPosition(options);
};