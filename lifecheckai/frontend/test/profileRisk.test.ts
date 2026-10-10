import { describe, it, expect } from "vitest";
import { calculatePersonalizedRisk } from "@/lib/profileRisk";
import type { SafetyData } from "@/types";
import { PROFILES } from "@/components/profile/HealthProfileSelector";

const mockSafetyData: SafetyData = {
  city: "Delhi",
  formatted_address: "Delhi, India",
  coordinates: { lat: 28.7041, lon: 77.1025 },
  overall: { verdict: "UNSAFE", color: "red", summary: "Hazardous air quality" },
  air_quality: {
    aqi: 320,
    category: "Hazardous",
    dominant_pollutant: "PM2.5",
    pollutants: { pm25: { value: 185, units: "ug/m3" } },
    level: "Hazardous",
    safe: false,
    advice: "Avoid outdoor activities",
  },
  weather: {
    temp_celsius: 42,
    feels_like: 45,
    humidity_percent: 65,
    condition: "Haze",
    uv_index: 9,
    wind_speed: 12,
    level: "Danger",
    safe: false,
    advice: "Heat wave warning",
  },
  pollen: {
    types: { grass: { level: 4, category: "High" } },
    level: "High",
    advice: "High pollen count",
  },
  source: "live",
  cache_hit: false,
};

describe("calculatePersonalizedRisk", () => {
  it("calculates elevated risk for asthma profile under high AQI", () => {
    const asthmaConfig = PROFILES.find((p) => p.id === "asthma")!;
    const result = calculatePersonalizedRisk(mockSafetyData, asthmaConfig);

    expect(result.personalRiskLevel).toBe("unsafe");
    expect(result.riskScore).toBeGreaterThan(50);
    expect(result.profileWarnings.length).toBeGreaterThan(0);
    expect(result.profileWarnings.some((w) => w.toLowerCase().includes("asthma") || w.toLowerCase().includes("aqi"))).toBe(true);
  });

  it("calculates heat stress warnings for elderly profile under 42C temp", () => {
    const elderlyConfig = PROFILES.find((p) => p.id === "elderly")!;
    const result = calculatePersonalizedRisk(mockSafetyData, elderlyConfig);

    expect(result.profileWarnings.some((w) => w.toLowerCase().includes("heat") || w.toLowerCase().includes("older"))).toBe(true);
  });

  it("returns base risk levels for general profile", () => {
    const generalConfig = PROFILES.find((p) => p.id === "general")!;
    const result = calculatePersonalizedRisk(mockSafetyData, generalConfig);

    expect(result.personalAQIThreshold).toBe(100);
  });
});
