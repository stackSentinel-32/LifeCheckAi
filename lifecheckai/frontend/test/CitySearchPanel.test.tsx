import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CitySearchPanel } from "../components/map/CitySearchPanel";
import React from "react";

// Mock framer-motion to avoid complex animation testing in jsdom
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, className }: { children: React.ReactNode, className?: string }) => <div className={className}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("CitySearchPanel", () => {
  it("renders correctly and displays summary statistics", () => {
    const props = {
      loading: false,
      monitoredSeedCities: [{ name: "Delhi" }],
      summary: { total: 10, unsafe: 2, caution: 3 },
      showZones: true,
      setShowZones: vi.fn(),
      onSearch: vi.fn(),
      fetchLocationSuggestions: vi.fn(),
    };

    render(<CitySearchPanel {...props} />);

    expect(screen.getByText("10 Cities")).toBeDefined();
    expect(screen.getByText(/Unsafe: 2/i)).toBeDefined();
    expect(screen.getByText(/Watch: 3/i)).toBeDefined();
  });

  it("calls setShowZones when toggle button is clicked", () => {
    const setShowZonesMock = vi.fn();
    const props = {
      loading: false,
      monitoredSeedCities: [],
      summary: { total: 0, unsafe: 0, caution: 0 },
      showZones: true,
      setShowZones: setShowZonesMock,
      onSearch: vi.fn(),
      fetchLocationSuggestions: vi.fn(),
    };

    render(<CitySearchPanel {...props} />);
    const toggleButton = screen.getByRole("button", { name: /Hide Zones/i });
    fireEvent.click(toggleButton);

    expect(setShowZonesMock).toHaveBeenCalled();
  });
});
