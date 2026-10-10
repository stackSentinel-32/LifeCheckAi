"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Wind, Thermometer, ShieldAlert, ArrowRight } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card } from "@/components/ui/Card";
import type { SafetyData } from "@/types";

interface MonitoredCity {
  name: string;
  lat: number;
  lon: number;
  status: "SAFE" | "CAUTION" | "UNSAFE" | "UNKNOWN";
  aqi: number | null;
  temp: number | null;
  updatedAt: number | null;
}

interface CityDetailDrawerProps {
  selectedCity: MonitoredCity | null;
  data: SafetyData | null;
  onClose: () => void;
  onReportRisk: () => void;
}

export function CityDetailDrawer({
  selectedCity,
  data,
  onClose,
  onReportRisk,
}: CityDetailDrawerProps) {
  return (
    <AnimatePresence>
      {selectedCity && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          className="absolute top-16 bottom-0 right-0 z-[60] w-[min(100vw,24rem)] bg-bg-card border-l border-border-default shadow-[-20px_0_40px_rgba(0,0,0,0.3)] flex flex-col pointer-events-auto"
        >
          {/* Header */}
          <div className="p-6 border-b border-border-default flex justify-between items-start">
            <div>
              <h2 className="h2-section mb-2">{selectedCity.name}</h2>
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedCity.status} />
                <span className="text-[10px] text-text-muted px-2 py-0.5 rounded-full border border-border-default uppercase">
                  {data?.city === selectedCity.name ? "Viewing Live" : "Stale"}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-bg-primary text-text-primary transition-colors cursor-pointer"
              title="Close Sidebar"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4 border-border-default flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Wind className="text-accent-primary" size={16} />
                  <span className="caption-muted">AQI Score</span>
                </div>
                <span className="text-2xl font-mono text-white mt-1">
                  {selectedCity.aqi ?? "—"}
                </span>
              </Card>
              <Card className="p-4 border-border-default flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Thermometer className="text-accent-violet" size={16} />
                  <span className="caption-muted">Temp</span>
                </div>
                <span className="text-2xl font-mono text-white mt-1">
                  {selectedCity.temp != null ? `${Math.round(selectedCity.temp)}°C` : "—"}
                </span>
              </Card>
            </div>

            {data?.city === selectedCity.name ? (
              <Card
                className={`p-5 border-border-default shadow-sm body-base ${
                  selectedCity.status === "UNSAFE"
                    ? "bg-danger/10 border-danger/20 text-danger-light"
                    : selectedCity.status === "CAUTION"
                    ? "bg-warning/10 border-warning/20 text-warning-light"
                    : "bg-safe/10 border-safe/20 text-safe-light"
                }`}
              >
                {data.overall?.summary || "Real-time conditions are available."}
              </Card>
            ) : (
              <Card className="p-5 border-border-default body-base flex flex-col items-center justify-center text-center gap-3">
                <ShieldAlert size={24} className="opacity-50" />
                Load full real-time data to see complete analysis, safety score rings, and AI insights.
              </Card>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border-default pb-8 flex flex-col gap-3 shrink-0">
            <button
              onClick={onReportRisk}
              className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-xl border border-border-default text-text-primary font-bold uppercase tracking-wider text-sm hover:border-accent-primary/40 hover:bg-white/5 transition-colors cursor-pointer"
            >
              <ShieldAlert size={16} /> Report Risk
            </button>
            <Link
              href={`/dashboard?city=${encodeURIComponent(selectedCity.name)}`}
              className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-xl bg-accent-primary text-bg-primary font-bold uppercase tracking-wider text-sm hover:brightness-110 transition-all shadow-md"
            >
              View Full Details <ArrowRight size={16} />
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
