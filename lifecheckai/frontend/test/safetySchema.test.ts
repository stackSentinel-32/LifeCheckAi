import { describe, it, expect } from "vitest";
import { parseSafetyResponse } from "@/lib/api/schemas/safety";

describe("SafetyDataSchema Zod Parsing", () => {
  it("validates and normalizes complete backend payload", () => {
    const rawPayload = {
      city: "Mumbai",
      formatted_address: "Mumbai, Maharashtra, India",
      coordinates: { lat: 19.076, lon: 72.8777 },
      overall: { verdict: "CAUTION", summary: "Moderate conditions" },
      air: { aqi: 110, status: "Moderate", dominant_pollutant: "PM10" },
      weather: { temp: 32, humidity: 75, condition: "Humid" },
      pollen: { level: "Low", types: { grass: { level: 1, category: "Low" } } },
      source: "live",
      cache_hit: false,
    };

    const validated = parseSafetyResponse(rawPayload);

    expect(validated.city).toBe("Mumbai");
    expect(validated.overall.verdict).toBe("CAUTION");
    expect(validated.air_quality.aqi).toBe(110);
    expect(validated.weather.temp_celsius).toBe(32);
    expect(validated.weather.humidity_percent).toBe(75);
    expect(validated.pollen.level).toBe("Low");
  });

  it("handles missing optional fields defensively", () => {
    const minimalPayload = {
      city: "Chennai",
    };

    const validated = parseSafetyResponse(minimalPayload);

    expect(validated.city).toBe("Chennai");
    expect(validated.overall.verdict).toBe("UNKNOWN");
    expect(validated.air_quality.aqi).toBeNull();
    expect(validated.weather.condition).toBe("Unknown");
  });

  it("throws Zod parse error when payload is not an object", () => {
    expect(() => parseSafetyResponse(null)).toThrow();
  });
});
