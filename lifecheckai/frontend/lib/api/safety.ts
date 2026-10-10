import { apiClient } from "./client";
import { parseSafetyResponse, type SafetyDataValidated } from "./schemas/safety";

export interface LocationSuggestion {
  city?: string;
  formatted_address?: string;
  lat?: number;
  lon?: number;
}

export interface LocationSuggestionResponse {
  query: string;
  count: number;
  suggestions: LocationSuggestion[];
}

export interface LiveCitiesResponse {
  count: number;
  cities: Array<{
    city: string;
    data: any;
    age_seconds: number;
  }>;
}

/**
 * Fetch complete safety snapshot for a city name, validated via Zod schema.
 */
export async function getSafetyByCity(city: string): Promise<SafetyDataValidated> {
  const raw = await apiClient<unknown>("/api/check-safety", {
    params: { city },
  });
  return parseSafetyResponse(raw);
}

/**
 * Fetch safety snapshot by GPS coordinates, validated via Zod schema.
 */
export async function getSafetyByCoordinates(
  lat: number,
  lon: number
): Promise<SafetyDataValidated> {
  const raw = await apiClient<unknown>("/api/check-safety-by-coordinates", {
    params: { lat, lon },
  });
  return parseSafetyResponse(raw);
}

/**
 * Fetch live snapshots for all monitored cities in backend scheduler cache.
 */
export async function getLiveCities(): Promise<LiveCitiesResponse> {
  return apiClient<LiveCitiesResponse>("/api/cities/live");
}

/**
 * Fetch location suggestions for autocompletion.
 */
export async function getLocationSuggestions(
  query: string,
  limit: number = 8
): Promise<LocationSuggestion[]> {
  const res = await apiClient<LocationSuggestionResponse>("/api/location-suggestions", {
    params: { q: query, limit },
  });
  return res.suggestions || [];
}
