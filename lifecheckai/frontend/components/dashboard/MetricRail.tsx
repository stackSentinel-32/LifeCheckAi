"use client";

import { motion, type Variants } from "framer-motion";
import { Wind, Thermometer, Flower2, Sun } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { CountUp } from "@/components/ui/CountUp";
import type { SafetyData } from "@/types";

interface MetricRailProps {
  data: SafetyData;
  variants?: Variants;
}

type Status = "safe" | "warning" | "danger" | "unknown";

function getStatusDotColor(status: Status): string {
  if (status === "safe") return "bg-safe";
  if (status === "warning") return "bg-warning";
  if (status === "danger") return "bg-danger";
  return "bg-text-muted";
}

function getAqiStatus(category: string | undefined): Status {
  if (!category) return "unknown";
  const cat = category.toLowerCase();
  if (cat.includes("good")) return "safe";
  if (cat.includes("moderate")) return "warning";
  if (cat.includes("unhealthy") || cat.includes("severe") || cat.includes("hazardous")) return "danger";
  return "unknown";
}

function getTempStatus(temp: number | null | undefined): Status {
  if (temp == null) return "unknown";
  if (temp >= 40) return "danger";
  if (temp >= 35) return "warning";
  return "safe";
}

function getPollenStatus(level: string | undefined): Status {
  if (!level) return "unknown";
  const l = level.toLowerCase();
  if (l === "low" || l === "none") return "safe";
  if (l === "moderate" || l === "medium") return "warning";
  if (l === "high" || l === "very high") return "danger";
  return "unknown";
}

function getUvStatus(uv: number | null | undefined): Status {
  if (uv == null) return "unknown";
  if (uv <= 2) return "safe";
  if (uv <= 5) return "warning";
  return "danger";
}

function getUVLabel(uv: number): string {
  if (uv <= 2) return "Low";
  if (uv <= 5) return "Moderate";
  if (uv <= 7) return "High";
  if (uv <= 10) return "Very High";
  return "Extreme";
}

export function MetricRail({ data, variants }: MetricRailProps) {
  return (
    <motion.div
      variants={variants}
      className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-white/10 rounded-2xl bg-bg-card border border-white/5 overflow-hidden"
    >
      {/* AQI */}
      <div className="flex-1 p-5 flex flex-col justify-between hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-2 text-text-secondary mb-3">
          <Wind size={16} aria-hidden="true" />
          <Tooltip content="AQI: Air Quality Index. 0-50 Good, 51-100 Moderate, 101+ Unhealthy."><span className="text-sm font-medium cursor-help">Air Quality</span></Tooltip>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-mono font-bold text-white">
            {data.air_quality?.aqi != null ? (
              <CountUp key={`aqi-${data.city}`} to={data.air_quality.aqi} duration={0.8} />
            ) : "—"}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className={`w-2 h-2 rounded-full ${getStatusDotColor(getAqiStatus(data.air_quality?.category))}`} aria-hidden="true" />
          <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold truncate">
            {data.air_quality?.category || "Unknown"}
          </span>
        </div>
      </div>

      {/* Temperature */}
      <div className="flex-1 p-5 flex flex-col justify-between hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-2 text-text-secondary mb-3">
          <Thermometer size={16} aria-hidden="true" />
          <Tooltip content="Current ambient temperature. Above 35C is caution, above 40C is danger."><span className="text-sm font-medium cursor-help">Temperature</span></Tooltip>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-mono font-bold text-white">
            {data.weather?.temp_celsius != null ? (
              <CountUp key={`temp-${data.city}`} to={Math.round(data.weather.temp_celsius)} duration={0.8} />
            ) : "—"}
          </span>
          <span className="text-sm text-text-muted">°C</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className={`w-2 h-2 rounded-full ${getStatusDotColor(getTempStatus(data.weather?.temp_celsius))}`} aria-hidden="true" />
          <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold truncate">
            {data.weather?.feels_like != null ? `Feels like ${Math.round(data.weather.feels_like)}°C` : "Unknown"}
          </span>
        </div>
      </div>

      {/* Pollen */}
      <div className="flex-1 p-5 flex flex-col justify-between hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-2 text-text-secondary mb-3">
          <Flower2 size={16} aria-hidden="true" />
          <Tooltip content="Pollen concentration level. High pollen may trigger allergies and asthma."><span className="text-sm font-medium cursor-help">Pollen Risk</span></Tooltip>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl sm:text-3xl font-mono font-bold text-white capitalize truncate">
            {data.pollen?.level || "N/A"}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className={`w-2 h-2 rounded-full ${getStatusDotColor(getPollenStatus(data.pollen?.level))}`} aria-hidden="true" />
          <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold truncate">
            {data.pollen?.advice || "No advice available"}
          </span>
        </div>
      </div>

      {/* UV */}
      <div className="flex-1 p-5 flex flex-col justify-between hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-2 text-text-secondary mb-3">
          <Sun size={16} aria-hidden="true" />
          <Tooltip content="UV Index. 0-2 Low, 3-5 Moderate, 6-7 High, 8-10 Very High, 11+ Extreme."><span className="text-sm font-medium cursor-help">UV Severity</span></Tooltip>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-mono font-bold text-white">
            {data.weather?.uv_index ?? "—"}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className={`w-2 h-2 rounded-full ${getStatusDotColor(getUvStatus(data.weather?.uv_index))}`} aria-hidden="true" />
          <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold truncate">
            {data.weather?.uv_index != null ? getUVLabel(data.weather.uv_index) : "Unknown"}
          </span>
        </div>
      </div>
    </motion.div>
  );
}


