"use client";

import { motion, type Variants } from "framer-motion";
import { AlertTriangle, Activity } from "lucide-react";
import { CountUp } from "@/components/ui/CountUp";
import type { SafetyData } from "@/types";

interface SafetyHeroProps {
  data: SafetyData;
  safetyScore: number;
  overallStatus: "safe" | "caution" | "unsafe" | "unknown";
  variants?: Variants;
}

const COLOR_MAP: Record<string, string> = {
  safe: "text-safe",
  caution: "text-warning",
  unsafe: "text-danger",
  unknown: "text-text-muted",
};

function buildVerdict(verdict: string | undefined, city: string): string {
  if (verdict === "SAFE") return `Safe to go outside in ${city}`;
  if (verdict === "CAUTION") return `Caution advised in ${city}`;
  if (verdict === "UNSAFE") return `Unsafe conditions in ${city}`;
  return `Checking conditions in ${city}...`;
}

export function SafetyHero({ data, safetyScore, overallStatus, variants }: SafetyHeroProps) {
  const colorClass = COLOR_MAP[overallStatus] ?? "text-text-muted";

  return (
    <motion.div variants={variants} className="mb-4 mt-6">
      <div className="flex flex-col gap-2 mb-4">
        {data.data_incomplete && (
          <div className="inline-flex items-center gap-2 bg-warning/10 border border-warning/30 text-warning px-3 py-1.5 rounded-lg text-sm font-medium w-fit">
            <AlertTriangle size={16} aria-hidden="true" />
            Limited data -- verdict may be incomplete
          </div>
        )}
        {data.realtime_sync === "degraded" && (
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-text-muted px-3 py-1.5 rounded-lg text-sm font-medium w-fit">
            <Activity size={16} className="opacity-70" aria-hidden="true" />
            Data may be delayed
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 mb-2">
        <h1
          className={`text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight ${colorClass} ${
            data.data_incomplete ? "opacity-75" : ""
          }`}
        >
          {buildVerdict(data.overall?.verdict, data.city)}
        </h1>
        <span className="text-2xl font-bold text-text-muted mt-2 sm:mt-0">
          <CountUp key={data.city} to={safetyScore} duration={0.8} />
          <span className="text-sm font-normal ml-1">Score</span>
        </span>
      </div>

      <p className="text-lg sm:text-xl text-text-secondary font-medium max-w-3xl leading-snug">
        {data.overall?.summary}
      </p>
    </motion.div>
  );
}

