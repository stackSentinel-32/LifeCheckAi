import { apiClient } from "./client";
import {
  WaterStatesResponseSchema,
  WaterStationsResponseSchema,
  WaterPredictionSchema,
  WaterTrendsSchema,
  WaterNearbyResponseSchema,
  WaterModelMetricsSchema
} from "./schemas/water";
import type {
  WaterModelMetrics,
  WaterNearbyResponse,
  WaterPrediction,
  WaterStatesResponse,
  WaterStationsResponse,
  WaterTrends,
} from "@/types/water";

export async function getWaterStates(): Promise<WaterStatesResponse> {
  const data = await apiClient<unknown>("/api/water/states");
  return WaterStatesResponseSchema.parse(data);
}

export async function getWaterStations(
  state: string,
  query?: string
): Promise<WaterStationsResponse> {
  const data = await apiClient<unknown>("/api/water/stations", {
    params: { state, q: query },
  });
  return WaterStationsResponseSchema.parse(data);
}

export async function getWaterPrediction(args: {
  state: string;
  stationId?: string;
  location?: string;
}): Promise<WaterPrediction> {
  const data = await apiClient<unknown>("/api/water/predict", {
    params: {
      state: args.state,
      station_id: args.stationId,
      location: args.location,
    },
  });
  return WaterPredictionSchema.parse(data);
}

export async function getWaterTrends(args: {
  state: string;
  stationId?: string;
  location?: string;
}): Promise<WaterTrends> {
  const data = await apiClient<unknown>("/api/water/trends", {
    params: {
      state: args.state,
      station_id: args.stationId,
      location: args.location,
    },
  });
  return WaterTrendsSchema.parse(data);
}

export async function getWaterNearby(
  lat: number,
  lon: number
): Promise<WaterNearbyResponse> {
  const data = await apiClient<unknown>("/api/water/nearby", {
    params: { lat, lon },
  });
  return WaterNearbyResponseSchema.parse(data);
}

export async function getWaterModelMetrics(): Promise<WaterModelMetrics> {
  const data = await apiClient<unknown>("/api/water/model-metrics");
  return WaterModelMetricsSchema.parse(data);
}
