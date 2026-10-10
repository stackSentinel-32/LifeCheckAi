import { z } from "zod";

export const WaterStateOptionSchema = z.object({
  name: z.string(),
  sample_count: z.number(),
  station_count: z.number(),
  years: z.array(z.number()),
});

export const WaterStationSchema = z.object({
  id: z.string(),
  code: z.string().nullable().optional(),
  name: z.string(),
  sample_count: z.number(),
  latest_year: z.number().nullable().optional(),
  years: z.array(z.number()),
  distance_km: z.number().nullable().optional(),
});

export const WaterParameterStatusSchema = z.object({
  param: z.string(),
  label: z.string(),
  unit: z.string(),
  value: z.number().nullable(),
  status: z.enum(["normal", "caution", "critical", "unknown"]),
  ideal_min: z.number().nullable().optional(),
  ideal_max: z.number().nullable().optional(),
  critical_min: z.number().nullable().optional(),
  critical_max: z.number().nullable().optional(),
  message: z.string(),
});

export const WaterResolvedPlaceSchema = z.object({
  city: z.string().nullable().optional(),
  formatted_address: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
});

export const WaterPredictionSchema = z.object({
  state: z.string(),
  scope: z.enum(["state", "station", "nearby"]),
  matched_station: z.object({
    id: z.string(),
    code: z.string().nullable().optional(),
    name: z.string(),
  }).nullable().optional(),
  matched_location: z.string().nullable().optional(),
  distance_km: z.number().nullable().optional(),
  resolved_place: WaterResolvedPlaceSchema.nullable().optional(),
  nearby_stations: z.array(WaterStationSchema),
  year: z.number(),
  available_years: z.array(z.number()),
  sample_count: z.number(),
  station_count: z.number().nullable().optional(),
  prediction: z.enum(["Drinkable", "Not Drinkable"]),
  confidence: z.number(),
  drinkable_probability: z.number(),
  not_drinkable_probability: z.number(),
  risk_level: z.string(),
  parameters: z.record(z.string(), z.number().nullable()),
  parameter_statuses: z.array(WaterParameterStatusSchema),
  violations: z.array(WaterParameterStatusSchema),
  recommendations: z.array(z.string()),
  model_version: z.string(),
});

export const WaterTrendOverviewSchema = z.object({
  latest: z.number().nullable(),
  first: z.number().nullable(),
  change: z.number().nullable(),
  direction: z.enum(["up", "down", "stable"]),
});

export const WaterTrendsSchema = z.object({
  state: z.string(),
  scope: z.enum(["state", "station", "nearby"]),
  matched_station: z.object({
    id: z.string(),
    code: z.string().nullable().optional(),
    name: z.string(),
  }).nullable().optional(),
  matched_location: z.string().nullable().optional(),
  distance_km: z.number().nullable().optional(),
  resolved_place: WaterResolvedPlaceSchema.nullable().optional(),
  nearby_stations: z.array(WaterStationSchema),
  years: z.array(z.number()),
  parameters: z.record(z.string(), z.array(z.number().nullable())),
  sample_counts: z.record(z.string(), z.number()),
  overview: z.record(z.string(), WaterTrendOverviewSchema),
});

export const WaterModelMetricsSchema = z.object({
  accuracy: z.number(),
  precision: z.number(),
  recall: z.number(),
  f1_score: z.number(),
  roc_auc: z.number(),
  oob_score: z.number(),
  confusion_matrix: z.array(z.array(z.number())),
  total_samples: z.number(),
  train_samples: z.number(),
  test_samples: z.number(),
  class_distribution: z.object({
    drinkable: z.number(),
    not_drinkable: z.number(),
  }),
  feature_importance: z.record(z.string(), z.number()),
  dataset_years: z.array(z.number()),
  label_definition: z.string(),
  model_version: z.string(),
});

export const WaterStatesResponseSchema = z.object({
  states: z.array(WaterStateOptionSchema),
  dataset_years: z.array(z.number()),
  count: z.number(),
});

export const WaterStationsResponseSchema = z.object({
  state: z.string(),
  stations: z.array(WaterStationSchema),
  count: z.number(),
});

export const WaterNearbyResponseSchema = z.object({
  resolved_place: WaterResolvedPlaceSchema.nullable().optional(),
  prediction: WaterPredictionSchema,
  trends: WaterTrendsSchema,
});
