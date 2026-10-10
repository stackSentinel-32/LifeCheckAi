import { useQuery } from "@tanstack/react-query";
import { waterKeys } from "./queryKeys";
import {
  getWaterStates,
  getWaterStations,
  getWaterPrediction,
  getWaterTrends,
  getWaterNearby,
  getWaterModelMetrics,
} from "@/lib/api/water";

export function useWaterStatesQuery() {
  return useQuery({
    queryKey: waterKeys.states(),
    queryFn: getWaterStates,
    staleTime: 60 * 60 * 1000, // States catalog rarely changes, cache for 1 hour
    gcTime: 24 * 60 * 60 * 1000,
  });
}

export function useWaterStationsQuery(state: string | null | undefined, query?: string) {
  const normalizedState = state?.trim();

  return useQuery({
    queryKey: waterKeys.stations(normalizedState || "", query),
    queryFn: () => getWaterStations(normalizedState!, query),
    enabled: Boolean(normalizedState && normalizedState.length > 0),
    staleTime: 30 * 60 * 1000,
  });
}

export function useWaterPredictionQuery(args: {
  state: string | null | undefined;
  stationId?: string;
  location?: string;
  enabled?: boolean;
}) {
  const normalizedState = args.state?.trim();
  const isEnabled = (args.enabled ?? true) && Boolean(normalizedState && normalizedState.length > 0);

  return useQuery({
    queryKey: waterKeys.prediction(normalizedState || "", args.stationId, args.location),
    queryFn: () =>
      getWaterPrediction({
        state: normalizedState!,
        stationId: args.stationId,
        location: args.location,
      }),
    enabled: isEnabled,
    staleTime: 10 * 60 * 1000,
  });
}

export function useWaterTrendsQuery(args: {
  state: string | null | undefined;
  stationId?: string;
  location?: string;
  enabled?: boolean;
}) {
  const normalizedState = args.state?.trim();
  const isEnabled = (args.enabled ?? true) && Boolean(normalizedState && normalizedState.length > 0);

  return useQuery({
    queryKey: waterKeys.trends(normalizedState || "", args.stationId, args.location),
    queryFn: () =>
      getWaterTrends({
        state: normalizedState!,
        stationId: args.stationId,
        location: args.location,
      }),
    enabled: isEnabled,
    staleTime: 10 * 60 * 1000,
  });
}

export function useWaterNearbyQuery(coords: { lat: number; lon: number } | null) {
  return useQuery({
    queryKey: coords ? waterKeys.nearby(coords.lat, coords.lon) : waterKeys.all,
    queryFn: () => getWaterNearby(coords!.lat, coords!.lon),
    enabled: Boolean(coords && typeof coords.lat === "number" && typeof coords.lon === "number"),
    staleTime: 10 * 60 * 1000,
  });
}

export function useWaterModelMetricsQuery() {
  return useQuery({
    queryKey: waterKeys.metrics(),
    queryFn: getWaterModelMetrics,
    staleTime: 60 * 60 * 1000,
  });
}
