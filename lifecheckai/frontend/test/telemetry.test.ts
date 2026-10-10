import { describe, it, expect, beforeEach } from "vitest";

// We need to mock localStorage and sessionStorage in jsdom
// The test file runs after setup.ts which configures jsdom

import {
  trackTaskStart,
  trackTaskComplete,
  trackTaskAbandoned,
  generateTelemetryReport,
} from "@/lib/telemetry";

function clearStorage() {
  sessionStorage.clear();
  localStorage.clear();
}

describe("Telemetry — task lifecycle", () => {
  beforeEach(() => {
    clearStorage();
  });

  it("records a completed task with positive duration", () => {
    trackTaskStart("find_safety");
    // simulate time passing (at least 1ms)
    const before = Date.now();
    while (Date.now() === before) {
      // busy-wait until clock ticks
    }
    trackTaskComplete("find_safety", { method: "search_bar" });

    const report = generateTelemetryReport();
    // All records go into one version bucket (assigned randomly)
    const vA = report.versionA;
    const vB = report.versionB;
    const totalCompleted = (vA.count > 0 ? vA : vB);
    expect(totalCompleted.count).toBe(1);
    expect(totalCompleted.avgDuration_ms).toBeGreaterThan(0);
    expect(totalCompleted.completionRate).toBe(100);
  });

  it("records an abandoned task with completed=false", () => {
    trackTaskStart("check_water");
    trackTaskAbandoned("check_water");

    const report = generateTelemetryReport();
    const all = [report.versionA, report.versionB];
    const hasRecord = all.some((v) => v.count === 1);
    expect(hasRecord).toBe(true);
    // completion rate should be 0 since it was abandoned
    const activeVersion = all.find((v) => v.count === 1)!;
    expect(activeVersion.completionRate).toBe(0);
  });

  it("does not complete a task that was never started", () => {
    // Should not throw and should record nothing
    expect(() => trackTaskComplete("navigate_to_alerts")).not.toThrow();
    const report = generateTelemetryReport();
    expect(report.versionA.count + report.versionB.count).toBe(0);
  });

  it("generates improvement percentage when both versions have data", () => {
    // Manually inject records into localStorage to simulate A/B data
    const records = [
      // Version A (slower): 80 seconds
      { task: "find_safety", version: "A", duration_ms: 80000, completed: true, interactions: 5, timestamp: Date.now() },
      // Version B (faster): 60 seconds
      { task: "find_safety", version: "B", duration_ms: 60000, completed: true, interactions: 2, timestamp: Date.now() },
    ];
    localStorage.setItem("lifecheck_telemetry_sessions", JSON.stringify(records));

    const report = generateTelemetryReport();
    expect(report.versionA.avgDuration_ms).toBe(80000);
    expect(report.versionB.avgDuration_ms).toBe(60000);
    // Improvement: (80000 - 60000) / 80000 * 100 = 25%
    expect(report.improvementPercent).toBe(25);
  });

  it("correctly separates version A and version B records", () => {
    const records = [
      { task: "find_safety", version: "A", duration_ms: 90000, completed: true, interactions: 6, timestamp: Date.now() },
      { task: "find_safety", version: "A", duration_ms: 70000, completed: true, interactions: 4, timestamp: Date.now() },
      { task: "find_safety", version: "B", duration_ms: 55000, completed: true, interactions: 2, timestamp: Date.now() },
    ];
    localStorage.setItem("lifecheck_telemetry_sessions", JSON.stringify(records));

    const report = generateTelemetryReport();
    expect(report.versionA.count).toBe(2);
    expect(report.versionA.avgDuration_ms).toBe(80000); // (90000+70000)/2
    expect(report.versionB.count).toBe(1);
    expect(report.versionB.avgDuration_ms).toBe(55000);
  });
});
