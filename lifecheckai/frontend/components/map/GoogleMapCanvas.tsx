"use client";

import { MapPin } from "lucide-react";
import { UserPresenceMarkers } from "@/components/realtime/UserPresenceMarkers";
import { CrowdReportMarkers } from "@/components/realtime/CrowdReportMarkers";

interface GoogleMapCanvasProps {
  apiKey: string;
  mapInitError: string | null;
  mapHolderRef: (node: HTMLDivElement | null) => void;
  presence: any[]; // Using any for simplicity here; types can be inferred
  crowdReports: any[];
  mapInstance: any;
}

export function GoogleMapCanvas({
  apiKey,
  mapInitError,
  mapHolderRef,
  presence,
  crowdReports,
  mapInstance,
}: GoogleMapCanvasProps) {
  return (
    <div className="absolute inset-0">
      {apiKey ? (
        <div className="w-full h-full relative">
          <div ref={mapHolderRef} className="w-full h-full" />
          {mapInitError && (
            <div className="absolute inset-0 bg-bg-primary/80 flex items-center justify-center">
              <div className="text-center px-6 glass p-6 rounded-2xl">
                <p className="text-sm text-unsafe">{mapInitError}</p>
                <p className="text-xs text-text-muted mt-2">
                  Please verify your Google Maps key.
                </p>
              </div>
            </div>
          )}
          <UserPresenceMarkers presence={presence} map={mapInstance} />
          <CrowdReportMarkers reports={crowdReports} map={mapInstance} />
        </div>
      ) : (
        <div className="w-full h-full bg-bg-primary flex items-center justify-center">
          <div className="text-center bg-bg-card border border-border-default p-8 rounded-2xl relative z-20">
            <MapPin size={48} className="text-text-muted mx-auto mb-4" />
            <p className="text-white">Map requires Google Maps API key.</p>
            <p className="text-accent-primary text-sm mt-2">
              Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
