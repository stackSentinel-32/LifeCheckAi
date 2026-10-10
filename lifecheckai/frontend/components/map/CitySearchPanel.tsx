"use client";

import { motion } from "framer-motion";
import { Radar, Layers3 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SearchBar } from "@/components/ui/SearchBar";

interface CitySearchPanelProps {
  loading: boolean;
  monitoredSeedCities: Array<{ name: string }>;
  summary: { total: number; unsafe: number; caution: number };
  showZones: boolean;
  setShowZones: (show: boolean | ((prev: boolean) => boolean)) => void;
  onSearch: (city: string) => void;
  fetchLocationSuggestions: (q: string) => Promise<Array<{ value: string; subtitle?: string }>>;
}

export function CitySearchPanel({
  loading,
  monitoredSeedCities,
  summary,
  showZones,
  setShowZones,
  onSearch,
  fetchLocationSuggestions,
}: CitySearchPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute top-20 left-4 lg:left-6 bottom-[4.5rem] z-[40] w-[min(92vw,22rem)] pointer-events-none"
    >
      <Card className="bg-bg-card/90 backdrop-blur-md border-border-default shadow-2xl flex flex-col h-full pointer-events-auto">
        {/* Search Panel */}
        <div className="p-5 flex flex-col gap-4">
          <SearchBar
            onSearch={onSearch}
            placeholder="Search city to focus map..."
            isLoading={loading}
            quickCities={monitoredSeedCities.map((entry) => entry.name)}
            fetchSuggestions={fetchLocationSuggestions}
          />
          <div className="flex items-center justify-between">
            <p className="caption-muted">Currently Tracking</p>
            <p className="text-sm font-bold text-accent-primary font-mono">
              {summary.total} Cities
            </p>
          </div>
          <div className="flex gap-2">
            <span className="px-2 py-1 bg-unsafe/10 border border-unsafe/20 rounded-md text-[10px] uppercase text-unsafe font-bold">
              Unsafe: {summary.unsafe}
            </span>
            <span className="px-2 py-1 bg-warning/10 border border-warning/20 rounded-md text-[10px] uppercase text-warning font-bold">
              Watch: {summary.caution}
            </span>
          </div>
        </div>

        <div className="flex-1" />

        {/* Legend */}
        <div className="p-5 border-t border-border-default bg-bg-primary/50">
          <p className="caption-muted text-text-primary mb-3 flex items-center gap-2">
            <Layers3 size={14} className="text-accent-primary" aria-hidden="true" />
            Map Legend
          </p>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-safe shadow-[0_0_8px_rgba(16,185,129,0.8)]" aria-hidden="true" />
              <span className="text-xs text-text-secondary font-medium uppercase tracking-wide">
                Safe Conditions
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-warning shadow-[0_0_8px_rgba(245,158,11,0.8)]" aria-hidden="true" />
              <span className="text-xs text-text-secondary font-medium uppercase tracking-wide">
                Moderate Risk
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-unsafe shadow-[0_0_8px_rgba(239,68,68,0.8)]" aria-hidden="true" />
              <span className="text-xs text-text-secondary font-medium uppercase tracking-wide">
                High Danger
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowZones((prev) => !prev)}
            className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg bg-bg-card py-2 text-xs text-text-secondary hover:text-text-primary transition-colors cursor-pointer border border-border-default"
          >
            <Radar size={12} aria-hidden="true" />
            {showZones ? "Hide Zones" : "Show Zones"}
          </button>
        </div>
      </Card>
    </motion.div>
  );
}
