"use client";

import { RefreshCw } from "lucide-react";
import { SearchBar } from "@/components/ui/SearchBar";
import type { SafetyData } from "@/types";

interface DashboardSearchBarProps {
  data: SafetyData | null;
  loading: boolean;
  lastUpdated: Date | null;
  watcherCount: number;
  quickCities: string[];
  onSearch: (city: string) => void;
  onLocate: () => void;
  onRefresh: () => void;
  fetchSuggestions: (q: string) => Promise<Array<{ value: string; subtitle?: string }>>;
  placeholder?: string;
}

function formatTime(date: Date | null): string {
  if (!date) return "—";
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export function DashboardSearchBar({
  data,
  loading,
  lastUpdated,
  watcherCount,
  quickCities,
  onSearch,
  onLocate,
  onRefresh,
  fetchSuggestions,
  placeholder = "Search another city...",
}: DashboardSearchBarProps) {
  return (
    <div className="sticky top-16 z-30 bg-bg-secondary/90 backdrop-blur-md border-b border-border-default px-4 sm:px-8 lg:px-16 py-3">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-1 w-full">
          <SearchBar
            onSearch={onSearch}
            onUseCurrentLocation={onLocate}
            placeholder={placeholder}
            isLoading={loading}
            isLocating={loading}
            quickCities={quickCities}
            fetchSuggestions={fetchSuggestions}
          />
        </div>
        {data && (
          <div className="flex items-center gap-3 text-sm shrink-0">
            <span className="text-text-primary font-semibold">{data.city}</span>
            <span className="text-text-muted" aria-hidden="true">·</span>
            <span className="text-text-muted">Updated {formatTime(lastUpdated)}</span>
            <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent-primary/20 bg-accent-primary/10 text-accent-primary text-xs font-semibold uppercase tracking-wider">
              👥 {watcherCount} live
            </span>
            <button
              type="button"
              onClick={onRefresh}
              className="p-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              aria-label="Refresh safety data"
              title="Refresh"
            >
              <RefreshCw size={16} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
