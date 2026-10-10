import { z } from "zod";

export const CoordinatesSchema = z.object({
  lat: z.number(),
  lon: z.number(),
});

export const OverallSchema = z.object({
  verdict: z.enum(["SAFE", "CAUTION", "UNSAFE", "UNKNOWN"]).default("UNKNOWN"),
  color: z.enum(["green", "yellow", "red"]).optional(),
  summary: z.string().default("No summary available."),
});

export const AirQualitySchema = z.object({
  aqi: z.number().nullable().optional(),
  category: z.string().default("Unknown"),
  dominant_pollutant: z.string().default(""),
  pollutants: z.record(
    z.string(),
    z.object({
      value: z.number().nullable().optional(),
      units: z.string().optional(),
    }).passthrough()
  ).default({}),
  level: z.string().default("Unknown"),
  safe: z.boolean().default(true),
  advice: z.string().default(""),
});

export const WeatherSchema = z.object({
  temp_celsius: z.number().nullable().optional(),
  feels_like: z.number().nullable().optional(),
  humidity_percent: z.number().nullable().optional(),
  condition: z.string().default("Unknown"),
  uv_index: z.number().nullable().optional(),
  wind_speed: z.number().nullable().optional(),
  level: z.string().default("Unknown"),
  safe: z.boolean().default(true),
  advice: z.string().default(""),
});

export const PollenSchema = z.object({
  types: z.record(
    z.string(),
    z.object({
      level: z.number().nullable().optional(),
      category: z.string().optional(),
    }).passthrough()
  ).default({}),
  level: z.string().default("Unknown"),
  advice: z.string().default(""),
});

export const AlertItemSchema = z.object({
  id: z.string().optional(),
  city: z.string(),
  type: z.string().optional(),
  level: z.string().optional(),
  category: z.enum(["air", "weather", "pollen", "uv", "water"]).optional(),
  severity: z.enum(["SAFE", "CAUTION", "UNSAFE", "critical", "high", "info", "warning"]).optional(),
  title: z.string().optional(),
  message: z.string().optional(),
  description: z.string().optional(),
  timestamp: z.union([z.string(), z.date()]).optional(),
});

export const SafetyDataSchema = z.object({
  city: z.string(),
  formatted_address: z.string().default(""),
  coordinates: CoordinatesSchema.nullable().optional(),
  overall: OverallSchema,
  air_quality: AirQualitySchema,
  weather: WeatherSchema,
  pollen: PollenSchema,
  source: z.string().default("live"),
  cache_hit: z.boolean().default(false),
  data_incomplete: z.boolean().optional(),
  realtime_sync: z.string().optional(),
  composite_score: z.number().nullable().optional(),
  alerts: z.array(AlertItemSchema).default([]),
});

export type SafetyDataValidated = z.infer<typeof SafetyDataSchema>;

/**
 * Raw API transformer that normalizes differing backend field names (e.g. `air` vs `air_quality`)
 * before passing through Zod parsing.
 */
export function parseSafetyResponse(raw: unknown): SafetyDataValidated {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid payload format received from backend");
  }

  const payload = raw as Record<string, any>;
  const airSource = payload.air_quality ?? payload.air ?? {};
  const weatherSource = payload.weather ?? {};
  const pollenSource = payload.pollen ?? {};

  const normalized = {
    city: payload.city || "Unknown City",
    formatted_address: payload.formatted_address || payload.city || "",
    coordinates: payload.coordinates
      ? {
          lat: Number(payload.coordinates.lat ?? payload.coordinates.latitude ?? 0),
          lon: Number(payload.coordinates.lon ?? payload.coordinates.longitude ?? 0),
        }
      : undefined,
    overall: {
      verdict: (payload.overall?.verdict || "UNKNOWN").toUpperCase(),
      color: payload.overall?.color,
      summary: payload.overall?.summary || "No summary available.",
    },
    air_quality: {
      aqi: typeof airSource.aqi === "number" ? airSource.aqi : null,
      category: airSource.category || airSource.status || "Unknown",
      dominant_pollutant: airSource.dominant_pollutant || "",
      pollutants: airSource.pollutants || {},
      level: airSource.level || airSource.status || "Unknown",
      safe: typeof airSource.safe === "boolean" ? airSource.safe : String(airSource.status || "").toUpperCase() === "SAFE",
      advice: airSource.advice || "",
    },
    weather: {
      temp_celsius: typeof weatherSource.temp_celsius === "number" ? weatherSource.temp_celsius : (typeof weatherSource.temp === "number" ? weatherSource.temp : null),
      feels_like: typeof weatherSource.feels_like === "number" ? weatherSource.feels_like : null,
      humidity_percent: typeof weatherSource.humidity_percent === "number" ? weatherSource.humidity_percent : (typeof weatherSource.humidity === "number" ? weatherSource.humidity : null),
      condition: weatherSource.condition || "Unknown",
      uv_index: typeof weatherSource.uv_index === "number" ? weatherSource.uv_index : null,
      wind_speed: typeof weatherSource.wind_speed === "number" ? weatherSource.wind_speed : null,
      level: weatherSource.level || weatherSource.status || "Unknown",
      safe: typeof weatherSource.safe === "boolean" ? weatherSource.safe : String(weatherSource.status || "").toUpperCase() === "SAFE",
      advice: weatherSource.advice || "",
    },
    pollen: {
      types: pollenSource.types || (typeof pollenSource === "object" ? pollenSource : {}),
      level: pollenSource.level || "Unknown",
      advice: pollenSource.advice || "",
    },
    source: payload.source || "live",
    cache_hit: Boolean(payload.cache_hit),
    data_incomplete: payload.data_incomplete,
    realtime_sync: payload.realtime_sync,
    composite_score: payload.composite_score,
    alerts: Array.isArray(payload.alerts) ? payload.alerts : [],
  };

  return SafetyDataSchema.parse(normalized);
}
