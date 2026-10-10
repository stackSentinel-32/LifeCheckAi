"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSafetyData } from "@/app/hooks/useSafetyData";
import { SearchBar } from "@/components/ui/SearchBar";
import { Card } from "@/components/ui/Card";
import { LoadingPulse } from "@/components/ui/LoadingPulse";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { SafetyHero } from "@/components/dashboard/SafetyHero";
import { MetricRail } from "@/components/dashboard/MetricRail";
import { MonitoredCityGrid, type MonitoredCitySnapshot, type MonitoredSortMode } from "@/components/dashboard/MonitoredCityGrid";
import { DashboardSearchBar } from "@/components/dashboard/DashboardSearchBar";
import {
  HealthProfileSelector,
  type HealthProfile,
  type ProfileConfig,
  PROFILES,
} from "@/components/profile/HealthProfileSelector";
import { PersonalRiskCard } from "@/components/profile/PersonalRiskCard";
import { calculatePersonalizedRisk } from "@/lib/profileRisk";
import { SafetyTimeline } from "@/components/forecast/SafetyTimeline";
import { VoiceBriefingButton } from "@/components/voice/VoiceBriefingButton";
import { VoiceSettingsPanel } from "@/components/voice/VoiceSettingsPanel";
import { useSharedCityState } from "@/hooks/useSharedCityState";
import { useProactiveVoiceAlerts } from "@/hooks/useProactiveVoiceAlerts";
import { Wind, AlertTriangle } from "lucide-react";
import { Dialog, DialogFooter, DialogClose } from "@/components/ui/Dialog";
import { INDIAN_STATE_NAMES } from "@/lib/indiaLocations";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
const MONITORED_CITIES_KEY = "lifecheck_monitored_cities";
const QUICK_CITY_OPTIONS = INDIAN_STATE_NAMES;

interface LocationSuggestionResponse {
  suggestions?: Array<{
    city?: string;
    formatted_address?: string;
  }>;
}

function normalizeCityName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function calculateUniversalSafetyScore(
  aqi: number | null | undefined,
  temp: number | null | undefined,
  pollenLevel: string | undefined
): number | null {
  if (aqi == null && temp == null) return null;
  const safeAqi = aqi ?? 100;
  const safeTemp = temp ?? 28;
  const pLevel = (pollenLevel || "").toLowerCase();
  const pollenPenalty = pLevel === "high" ? 15 : pLevel === "moderate" ? 8 : 0;
  const baseScore = 100 - safeAqi / 5;
  const heatPenalty = safeTemp > 40 ? 20 : safeTemp > 35 ? 10 : 0;
  return Math.max(0, Math.min(100, Math.round(baseScore - heatPenalty - pollenPenalty)));
}

function getStatusColor(verdict: string | undefined): "safe" | "caution" | "unsafe" | "unknown" {
  if (!verdict) return "unknown";
  const v = verdict.toUpperCase();
  if (v === "SAFE") return "safe";
  if (v === "CAUTION") return "caution";
  if (v === "UNSAFE") return "unsafe";
  return "unknown";
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function DashboardPageContent() {
  const { data, loading, error, city, search, refresh, lastUpdated, locateMe } = useSafetyData();
  const searchParams = useSearchParams();
  const { watcherCount } = useSharedCityState(data?.city || city);
  const [monitoredCities, setMonitoredCities] = useState<string[]>([]);
  const [monitoredData, setMonitoredData] = useState<Record<string, MonitoredCitySnapshot>>({});
  const [selectedProfile, setSelectedProfile] = useState<HealthProfile>("general");
  const [profileConfig, setProfileConfig] = useState<ProfileConfig>(PROFILES[0]);
  const [sortMode, setSortMode] = useState<MonitoredSortMode>("risk");
  const [alertsDialogOpen, setAlertsDialogOpen] = useState(false);

  useProactiveVoiceAlerts(
    data?.city,
    data?.overall?.verdict,
    data?.air_quality?.aqi,
    data?.weather?.temp_celsius,
  );

  // Persist monitored cities
  useEffect(() => {
    try {
      const raw = localStorage.getItem(MONITORED_CITIES_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setMonitoredCities(
          parsed.map((item) => (typeof item === "string" ? normalizeCityName(item) : "")).filter(Boolean),
        );
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!data?.city || monitoredCities.length > 0) return;
    setMonitoredCities([normalizeCityName(data.city)]);
  }, [data?.city, monitoredCities.length]);

  useEffect(() => {
    if (monitoredCities.length === 0) return;
    localStorage.setItem(MONITORED_CITIES_KEY, JSON.stringify(monitoredCities));
  }, [monitoredCities]);

  const fetchMonitoredCity = useCallback(async (cityName: string): Promise<MonitoredCitySnapshot> => {
    const response = await fetch(`${API_BASE}/api/check-safety?city=${encodeURIComponent(cityName)}`);
    if (!response.ok) throw new Error(`Unable to refresh ${cityName}`);
    const payload = await response.json();
    const air = payload.air_quality ?? payload.air ?? {};
    const weather = payload.weather ?? {};
    return {
      city: payload.city || cityName,
      verdict: payload.overall?.verdict || "UNKNOWN",
      summary: payload.overall?.summary || "No summary available.",
      aqi: typeof air?.aqi === "number" ? air.aqi : null,
      temp: typeof weather?.temp_celsius === "number" ? weather.temp_celsius : typeof weather?.temp === "number" ? weather.temp : null,
      humidity: typeof weather?.humidity_percent === "number" ? weather.humidity_percent : typeof weather?.humidity === "number" ? weather.humidity : null,
      pollenLevel: payload.pollen?.level || "",
      source: payload.source || "live",
      updatedAt: Date.now(),
    };
  }, []);

  const refreshMonitoredCities = useCallback(async (cityList: string[]) => {
    if (cityList.length === 0) return;
    const results = await Promise.all(
      cityList.map(async (entry) => {
        try {
          return await fetchMonitoredCity(entry);
        } catch {
          return {
            city: entry, verdict: "UNKNOWN", summary: "Snapshot unavailable.",
            aqi: null, temp: null, humidity: null, pollenLevel: "", source: "cache", updatedAt: Date.now(),
          } as MonitoredCitySnapshot;
        }
      }),
    );
    setMonitoredData(
      results.reduce<Record<string, MonitoredCitySnapshot>>((acc, item) => {
        acc[item.city] = item;
        return acc;
      }, {}),
    );
  }, [fetchMonitoredCity]);

  useEffect(() => { refreshMonitoredCities(monitoredCities); }, [monitoredCities, refreshMonitoredCities]);

  const addMonitoredCity = useCallback((inputCity: string) => {
    const normalized = normalizeCityName(inputCity);
    if (!normalized) return;
    setMonitoredCities((prev) => {
      if (prev.some((e) => e.toLowerCase() === normalized.toLowerCase())) return prev;
      return [normalized, ...prev].slice(0, 8);
    });
  }, []);

  const removeMonitoredCity = useCallback((cityName: string) => {
    setMonitoredCities((prev) => prev.filter((e) => e.toLowerCase() !== cityName.toLowerCase()));
    setMonitoredData((prev) => { const next = { ...prev }; delete next[cityName]; return next; });
  }, []);

  const monitoredEntries = useMemo(() => {
    const entries = monitoredCities
      .map((c) => monitoredData[c] || monitoredData[c.trim()])
      .filter(Boolean) as MonitoredCitySnapshot[];

    return [...entries].sort((a, b) => {
      if (sortMode === "name") return a.city.localeCompare(b.city);
      if (sortMode === "aqi") return (b.aqi ?? -1) - (a.aqi ?? -1);
      // "risk": lowest safety score first
      const scoreA = calculateUniversalSafetyScore(a.aqi, a.temp, a.pollenLevel) ?? 100;
      const scoreB = calculateUniversalSafetyScore(b.aqi, b.temp, b.pollenLevel) ?? 100;
      return scoreA - scoreB;
    });
  }, [monitoredCities, monitoredData, sortMode]);

  const fetchLocationSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 2) return [];
    const response = await fetch(`${API_BASE}/api/location-suggestions?q=${encodeURIComponent(query)}&limit=8`);
    if (!response.ok) return [];
    const payload = (await response.json()) as LocationSuggestionResponse;
    return (payload.suggestions || [])
      .map((entry) => {
        const value = entry.city || entry.formatted_address || "";
        if (!value) return null;
        return { value, subtitle: entry.formatted_address && entry.formatted_address !== value ? entry.formatted_address : undefined };
      })
      .filter(Boolean) as Array<{ value: string; subtitle?: string }>;
  }, []);

  const smartQuickCities = useMemo(() => {
    const merged = [...monitoredCities, ...QUICK_CITY_OPTIONS];
    return merged.filter((c, i) => merged.findIndex((x) => x.toLowerCase() === c.toLowerCase()) === i);
  }, [monitoredCities]);

  useEffect(() => {
    const cityParam = searchParams.get("city");
    if (cityParam && cityParam !== city) search(cityParam);
  }, [searchParams, city, search]);

  useEffect(() => {
    const onLocate = () => locateMe();
    const onRefresh = () => refresh();
    window.addEventListener("lifecheck:locate-me", onLocate);
    window.addEventListener("lifecheck:refresh", onRefresh);
    return () => {
      window.removeEventListener("lifecheck:locate-me", onLocate);
      window.removeEventListener("lifecheck:refresh", onRefresh);
    };
  }, [locateMe, refresh]);

  useEffect(() => {
    if (!data) return;
    document.title = `${data.city} Safety Report — ${profileConfig.label} Profile`;
  }, [data, profileConfig.label]);

  const overallStatus = getStatusColor(data?.overall?.verdict);
  const safetyScore = useMemo(() => {
    if (!data) return 0;
    return calculateUniversalSafetyScore(data.air_quality?.aqi, data.weather?.temp_celsius, data.pollen?.level) ?? 0;
  }, [data]);
  const personalRisk = useMemo(() => (!data ? null : calculatePersonalizedRisk(data, profileConfig)), [data, profileConfig]);

  // ── Error state ──────────────────────────────────────────────────────────
  if (error && !data) {
    return (
      <div className="min-h-screen px-4 sm:px-8 lg:px-16 py-8">
        <div className="max-w-2xl mx-auto mt-8">
          <SearchBar onSearch={search} onUseCurrentLocation={locateMe} placeholder="Search any city..." isLoading={loading} isLocating={loading} quickCities={smartQuickCities} fetchSuggestions={fetchLocationSuggestions} />
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
            <Card className="border-unsafe/30 text-center py-12">
              <AlertTriangle size={48} className="text-unsafe mx-auto mb-4" />
              <h3 className="h3-card mb-2">Error</h3>
              <p className="body-base mb-6">{error}</p>
              <button onClick={refresh} className="btn-primary">Try Again</button>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────
  if (!data && !loading) {
    return (
      <div className="min-h-screen px-4 sm:px-8 lg:px-16 py-8">
        <div className="max-w-2xl mx-auto mt-8">
          <SearchBar onSearch={search} onUseCurrentLocation={locateMe} placeholder="Enter a city to check safety conditions..." isLoading={loading} isLocating={loading} quickCities={smartQuickCities} fetchSuggestions={fetchLocationSuggestions} />
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
            <Card className="text-center py-16">
              <Wind size={48} className="text-text-muted mx-auto mb-4" />
              <h3 className="h3-card mb-2">Search a City</h3>
              <p className="body-base">Enter any city name above to view real-time safety conditions.</p>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Main dashboard ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <DashboardSearchBar
        data={data}
        loading={loading}
        lastUpdated={lastUpdated}
        watcherCount={watcherCount}
        quickCities={smartQuickCities}
        onSearch={search}
        onLocate={locateMe}
        onRefresh={refresh}
        fetchSuggestions={fetchLocationSuggestions}
      />

      {loading && <LoadingPulse inline text="Fetching safety data..." />}

      {data && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto px-4 sm:px-8 py-8 flex flex-col gap-6"
        >
          {/* Profile + Voice settings strip */}
          <motion.div variants={itemVariants} className="card !p-0 overflow-hidden mb-2">
            <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-border-default">
              <div className="flex-1 p-4 bg-bg-card">
                <HealthProfileSelector
                  onProfileChange={(profile, config) => { setSelectedProfile(profile); setProfileConfig(config); }}
                  embedded={true}
                />
              </div>
              <div className="flex-1 p-4 bg-bg-card">
                <VoiceSettingsPanel embedded={true} />
              </div>
            </div>
          </motion.div>

          {/* Verdict hero */}
          <SafetyHero data={data} safetyScore={safetyScore} overallStatus={overallStatus} variants={itemVariants} />

          {/* AQI / Temp / Pollen / UV rail */}
          <MetricRail data={data} variants={itemVariants} />

          {/* Personalized risk panel */}
          {selectedProfile !== "general" && personalRisk && (
            <motion.div variants={itemVariants}>
              <PersonalRiskCard
                risk={personalRisk}
                profile={profileConfig}
                onChangeProfile={() => window.dispatchEvent(new CustomEvent("lifecheck:open-profile"))}
              />
            </motion.div>
          )}

          {/* Monitored territories */}
          <MonitoredCityGrid
            entries={monitoredEntries}
            onSearch={search}
            onAdd={addMonitoredCity}
            onRemove={removeMonitoredCity}
            currentCity={data?.city}
            sortMode={sortMode}
            onSortChange={setSortMode}
            variants={itemVariants}
          />

          {/* Safety timeline */}
          <motion.div variants={itemVariants}>
            <SafetyTimeline currentData={data} />
          </motion.div>

          {/* Active alerts dialog — opened from voice alert or external event */}
          {data.alerts && data.alerts.length > 0 && (
            <Dialog
              open={alertsDialogOpen}
              onOpenChange={setAlertsDialogOpen}
              title={`Active Alerts — ${data.city}`}
              description={`${data.alerts.length} alert${data.alerts.length !== 1 ? "s" : ""} detected for your current location.`}
            >
              <ul className="flex flex-col gap-3 max-h-80 overflow-y-auto pr-1">
                {data.alerts.map((alert, i) => (
                  <li key={alert.id ?? i} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/8">
                    <span className={`shrink-0 mt-0.5 w-2 h-2 rounded-full ${
                      alert.severity === "critical" || alert.severity === "UNSAFE" ? "bg-danger" :
                      alert.severity === "high" || alert.severity === "CAUTION" ? "bg-warning" : "bg-safe"
                    }`} aria-hidden="true" />
                    <div>
                      {alert.title && <p className="text-sm font-semibold text-text-primary">{alert.title}</p>}
                      <p className="text-xs text-text-muted mt-0.5">{alert.message ?? alert.description ?? "No details."}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <DialogFooter>
                <DialogClose asChild>
                  <button className="btn-primary text-sm">Dismiss</button>
                </DialogClose>
              </DialogFooter>
            </Dialog>
          )}
        </motion.div>
      )}
      <VoiceBriefingButton safetyData={data || null} />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardPageContent />
    </Suspense>
  );
}
