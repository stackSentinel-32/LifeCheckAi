import { useQuery } from "@tanstack/react-query";
import { safetyKeys } from "./queryKeys";
import {
  getSafetyByCity,
  getSafetyByCoordinates,
  getLiveCities,
  getLocationSuggestions,
} from "@/lib/api/safety";

/**
 * Primary safety query hook for city name with 60s background polling and stale caching.
 */
export function useSafetyCityQuery(city: string | null | undefined) {
  const normalizedCity = city?.trim();

  return useQuery({
    queryKey: safetyKeys.city(normalizedCity || ""),
    queryFn: () => getSafetyByCity(normalizedCity!),
    enabled: Boolean(normalizedCity && normalizedCity.length > 0),
    staleTime: 60 * 1000, // 60s fresh time
    gcTime: 10 * 60 * 1000, // 10m cache garbage collection
    refetchInterval: 60 * 1000, // automatic background sync every 60s
    retry: (failureCount, error: any) => {
      // Don't retry on 404 (city not found)
      if (error?.status === 404) return false;
      return failureCount < 2;
    },
  });
}

/**
 * Safety query hook by GPS latitude and longitude.
 */
export function useSafetyCoordinatesQuery(
  coords: { lat: number; lon: number } | null
) {
  return useQuery({
    queryKey: coords ? safetyKeys.coordinates(coords.lat, coords.lon) : safetyKeys.all,
    queryFn: () => getSafetyByCoordinates(coords!.lat, coords!.lon),
    enabled: Boolean(coords && typeof coords.lat === "number" && typeof coords.lon === "number"),
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Live multi-city scheduler query hook for dashboard tracking and risk maps.
 */
export function useLiveCitiesQuery() {
  return useQuery({
    queryKey: safetyKeys.liveCities(),
    queryFn: getLiveCities,
    staleTime: 45 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}

/**
 * Autocompletion search suggestions query hook.
 */
export function useLocationSuggestionsQuery(query: string, limit = 8) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: safetyKeys.suggestions(trimmed),
    queryFn: () => getLocationSuggestions(trimmed, limit),
    enabled: trimmed.length >= 2,
    staleTime: 5 * 60 * 1000, // Search suggestions remain fresh for 5 mins
  });
}
