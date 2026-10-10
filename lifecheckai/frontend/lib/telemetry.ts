/**
 * LifeCheck AI — Task Completion Telemetry Module
 *
 * Purpose: Measure real user task-completion times to substantiate (or refute)
 * the "25% completion time improvement" claim between navigation variants.
 *
 * Experiment Design:
 *   Version A (control)  — standard navbar + search bar navigation
 *   Version B (variant)  — command palette + accessibility-improved UI
 *
 * Tracked Tasks:
 *   find_safety          — "Find if Mumbai is safe to go outside"
 *   check_water          — "Check water quality for a state"
 *   navigate_to_alerts   — "Navigate to the Alerts page"
 *   compare_cities       — "Compare safety across two cities"
 *
 * Data is stored in sessionStorage (per-session) and localStorage (aggregate).
 * In production, this would POST to a backend analytics endpoint.
 */

export type TaskName =
  | "find_safety"
  | "check_water"
  | "navigate_to_alerts"
  | "compare_cities";

type ExperimentVersion = "A" | "B";

export interface TaskRecord {
  task: TaskName;
  version: ExperimentVersion;
  duration_ms: number;
  completed: boolean;
  interactions: number;
  timestamp: number;
}

interface TelemetrySession {
  session_id: string;
  version: ExperimentVersion;
  started_at: number;
  records: TaskRecord[];
}

const TELEMETRY_KEY = "lifecheck_telemetry_sessions";
const SESSION_KEY = "lifecheck_current_session";
const VERSION_KEY = "lifecheck_experiment_version";

/** Deterministically assign user to A or B (50/50 split via random). */
function assignExperimentVersion(): ExperimentVersion {
  if (typeof window === "undefined") return "B";
  const stored = sessionStorage.getItem(VERSION_KEY) as ExperimentVersion | null;
  if (stored === "A" || stored === "B") return stored;
  const assigned: ExperimentVersion = Math.random() < 0.5 ? "A" : "B";
  sessionStorage.setItem(VERSION_KEY, assigned);
  return assigned;
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function getOrCreateSession(): TelemetrySession {
  if (typeof window === "undefined") {
    return {
      session_id: "ssr",
      version: "B",
      started_at: Date.now(),
      records: [],
    };
  }
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as TelemetrySession;
    } catch {
      // corrupted — create fresh
    }
  }
  const session: TelemetrySession = {
    session_id: generateSessionId(),
    version: assignExperimentVersion(),
    started_at: Date.now(),
    records: [],
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

function saveSession(session: TelemetrySession): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

// ── Interaction counting ───────────────────────────────────────────────────────

const taskInteractionCounts: Partial<Record<TaskName, number>> = {};

/** Call this every time the user clicks, navigates, or types during a task. */
export function trackInteraction(task: TaskName): void {
  taskInteractionCounts[task] = (taskInteractionCounts[task] ?? 0) + 1;
}

// ── Task lifecycle ─────────────────────────────────────────────────────────────

const taskStartTimes: Partial<Record<TaskName, number>> = {};

/**
 * Mark the start of a user task.
 * Should be called when the user initiates the relevant action (e.g. opens search).
 */
export function trackTaskStart(task: TaskName): void {
  taskStartTimes[task] = Date.now();
  taskInteractionCounts[task] = 0;
  if (process.env.NODE_ENV === "development") {
    console.debug(`[Telemetry] Task started: ${task}`);
  }
}

/**
 * Mark the completion of a user task.
 * Should be called when the goal is definitively reached (e.g. safety verdict is displayed).
 */
export function trackTaskComplete(
  task: TaskName,
  metadata?: Record<string, unknown>
): void {
  const start = taskStartTimes[task];
  if (!start) return;

  const duration_ms = Date.now() - start;
  const interactions = taskInteractionCounts[task] ?? 0;

  delete taskStartTimes[task];
  delete taskInteractionCounts[task];

  const session = getOrCreateSession();
  const record: TaskRecord = {
    task,
    version: session.version,
    duration_ms,
    completed: true,
    interactions,
    timestamp: Date.now(),
  };

  session.records.push(record);
  saveSession(session);

  // Persist to localStorage aggregate
  persistRecord(record);

  if (process.env.NODE_ENV === "development") {
    console.info(
      `[Telemetry] Task complete: ${task} | ${duration_ms}ms | ${interactions} interactions | version=${session.version}`,
      metadata
    );
  }
}

/**
 * Mark a task as abandoned (user navigated away without completing).
 */
export function trackTaskAbandoned(task: TaskName): void {
  const start = taskStartTimes[task];
  if (!start) return;

  const duration_ms = Date.now() - start;
  const interactions = taskInteractionCounts[task] ?? 0;

  delete taskStartTimes[task];
  delete taskInteractionCounts[task];

  const session = getOrCreateSession();
  const record: TaskRecord = {
    task,
    version: session.version,
    duration_ms,
    completed: false,
    interactions,
    timestamp: Date.now(),
  };

  session.records.push(record);
  saveSession(session);
  persistRecord(record);
}

// ── Persistence & analytics ────────────────────────────────────────────────────

function persistRecord(record: TaskRecord): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(TELEMETRY_KEY);
    const all: TaskRecord[] = raw ? JSON.parse(raw) : [];
    all.push(record);
    // Cap at 500 records to avoid localStorage bloat
    const capped = all.slice(-500);
    localStorage.setItem(TELEMETRY_KEY, JSON.stringify(capped));
  } catch {
    // localStorage unavailable or full
  }
}

// ── Report generation ──────────────────────────────────────────────────────────

export interface TelemetryReport {
  totalSessions: number;
  versionA: VersionStats;
  versionB: VersionStats;
  improvementPercent: number | null;
}

export interface VersionStats {
  count: number;
  avgDuration_ms: number;
  avgInteractions: number;
  completionRate: number;
  taskBreakdown: Partial<Record<TaskName, { avg_ms: number; count: number }>>;
}

function computeVersionStats(records: TaskRecord[]): VersionStats {
  const completed = records.filter((r) => r.completed);
  const total = records.length;

  const avgDuration_ms =
    completed.length > 0
      ? Math.round(completed.reduce((sum, r) => sum + r.duration_ms, 0) / completed.length)
      : 0;

  const avgInteractions =
    completed.length > 0
      ? Math.round(completed.reduce((sum, r) => sum + r.interactions, 0) / completed.length)
      : 0;

  const taskBreakdown: VersionStats["taskBreakdown"] = {};
  const tasks: TaskName[] = ["find_safety", "check_water", "navigate_to_alerts", "compare_cities"];

  for (const task of tasks) {
    const taskRecords = completed.filter((r) => r.task === task);
    if (taskRecords.length > 0) {
      taskBreakdown[task] = {
        avg_ms: Math.round(taskRecords.reduce((s, r) => s + r.duration_ms, 0) / taskRecords.length),
        count: taskRecords.length,
      };
    }
  }

  return {
    count: total,
    avgDuration_ms,
    avgInteractions,
    completionRate: total > 0 ? Math.round((completed.length / total) * 100) : 0,
    taskBreakdown,
  };
}

/**
 * Generate a full A/B comparison report from localStorage data.
 * Call this in dev tools or a debug panel.
 */
export function generateTelemetryReport(): TelemetryReport {
  if (typeof window === "undefined") {
    return {
      totalSessions: 0,
      versionA: { count: 0, avgDuration_ms: 0, avgInteractions: 0, completionRate: 0, taskBreakdown: {} },
      versionB: { count: 0, avgDuration_ms: 0, avgInteractions: 0, completionRate: 0, taskBreakdown: {} },
      improvementPercent: null,
    };
  }

  try {
    const raw = localStorage.getItem(TELEMETRY_KEY);
    const all: TaskRecord[] = raw ? JSON.parse(raw) : [];

    const aRecords = all.filter((r) => r.version === "A");
    const bRecords = all.filter((r) => r.version === "B");

    const versionA = computeVersionStats(aRecords);
    const versionB = computeVersionStats(bRecords);

    let improvementPercent: number | null = null;
    if (versionA.avgDuration_ms > 0 && versionB.avgDuration_ms > 0) {
      improvementPercent = Math.round(
        ((versionA.avgDuration_ms - versionB.avgDuration_ms) / versionA.avgDuration_ms) * 100
      );
    }

    // Unique session count from all records
    const sessionSet = new Set(
      all.map((r) => `${r.version}_${Math.floor(r.timestamp / 60000)}`)
    );

    return {
      totalSessions: sessionSet.size,
      versionA,
      versionB,
      improvementPercent,
    };
  } catch {
    return {
      totalSessions: 0,
      versionA: { count: 0, avgDuration_ms: 0, avgInteractions: 0, completionRate: 0, taskBreakdown: {} },
      versionB: { count: 0, avgDuration_ms: 0, avgInteractions: 0, completionRate: 0, taskBreakdown: {} },
      improvementPercent: null,
    };
  }
}

/** Return the current session's experiment version. */
export function getExperimentVersion(): ExperimentVersion {
  return getOrCreateSession().version;
}
