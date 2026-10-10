"use client";

import { motion, type Variants } from "framer-motion";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { Radar, Plus, Trash2, SlidersHorizontal } from "lucide-react";

export interface MonitoredCitySnapshot {
  city: string;
  verdict: "SAFE" | "CAUTION" | "UNSAFE" | "UNKNOWN";
  summary: string;
  aqi: number | null;
  temp: number | null;
  humidity: number | null;
  pollenLevel: string;
  source: string;
  updatedAt: number;
}

export type MonitoredSortMode = "risk" | "aqi" | "name";

interface MonitoredCityGridProps {
  entries: MonitoredCitySnapshot[];
  onSearch: (city: string) => void;
  onAdd: (city: string) => void;
  onRemove: (city: string) => void;
  currentCity: string | undefined;
  sortMode?: MonitoredSortMode;
  onSortChange?: (mode: MonitoredSortMode) => void;
  variants?: Variants;
}

type StatusColor = "safe" | "caution" | "unsafe" | "unknown";

function getStatusColor(verdict: string | undefined): StatusColor {
  const v = (verdict || "").toUpperCase();
  if (v === "SAFE") return "safe";
  if (v === "CAUTION") return "caution";
  if (v === "UNSAFE") return "unsafe";
  return "unknown";
}

function getDotColor(status: StatusColor): string {
  if (status === "safe") return "bg-safe";
  if (status === "caution") return "bg-warning";
  if (status === "unsafe") return "bg-danger";
  return "bg-text-muted";
}

export function MonitoredCityGrid({
  entries,
  onSearch,
  onAdd,
  onRemove,
  currentCity,
  sortMode,
  onSortChange,
  variants,
}: MonitoredCityGridProps) {
  return (
    <motion.div variants={variants} className="mt-8 pt-8 border-t border-border-default">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
          <Radar size={16} aria-hidden="true" />
          Monitored Territories
        </h3>
        <div className="flex items-center gap-2">
          {onSortChange && (
            <DropdownMenu
              align="end"
              trigger={
                <button
                  type="button"
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
                  aria-label="Sort monitored cities"
                  title="Sort"
                >
                  <SlidersHorizontal size={14} aria-hidden="true" />
                </button>
              }
              label="Sort by"
              items={[
                { label: "Highest Risk", checked: sortMode === "risk", onClick: () => onSortChange("risk") },
                { label: "AQI", checked: sortMode === "aqi", onClick: () => onSortChange("aqi") },
                { label: "Name", checked: sortMode === "name", onClick: () => onSortChange("name") },
              ]}
            />
          )}
          <button
            type="button"
            onClick={() => currentCity && onAdd(currentCity)}
            className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1 text-accent-primary hover:text-white transition-colors cursor-pointer"
            aria-label={`Add ${currentCity ?? "current city"} to monitored territories`}
          >
            <Plus size={14} aria-hidden="true" />
            Track City
          </button>
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-text-muted italic">
          You are not tracking any additional locations yet.
        </p>
      ) : (
        <div className="flex flex-wrap gap-3" role="list" aria-label="Monitored cities">
          {entries.map((entry) => {
            const status = getStatusColor(entry.verdict);
            return (
              <button
                key={entry.city}
                type="button"
                role="listitem"
                onClick={() => onSearch(entry.city)}
                aria-label={`View safety report for ${entry.city}, status ${entry.verdict}, AQI ${
                  entry.aqi ?? "unavailable"
                }, temperature ${entry.temp != null ? Math.round(entry.temp) + " degrees Celsius" : "unavailable"}`}
                className="flex items-center gap-3 px-4 py-2 rounded-full bg-bg-card border border-white/5 hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary transition-all cursor-pointer group text-left"
              >
                <div className={`w-2 h-2 rounded-full ${getDotColor(status)}`} aria-hidden="true" />
                <span className="text-sm font-semibold text-white">{entry.city}</span>
                <div className="w-px h-3 bg-white/20" aria-hidden="true" />
                <span className="text-xs font-mono text-text-muted">{entry.aqi ?? "—"} AQI</span>
                <span className="text-xs font-mono text-text-muted">
                  {entry.temp != null ? `${Math.round(entry.temp)}°C` : "—"}
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={`Remove ${entry.city} from monitored territories`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(entry.city);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation();
                      e.preventDefault();
                      onRemove(entry.city);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity ml-1 text-text-muted hover:text-danger cursor-pointer p-0.5"
                  title="Remove City"
                >
                  <Trash2 size={12} aria-hidden="true" />
                </span>
              </button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}


