"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { MapProvider } from "@/components/atlas/MapProvider";

export function MapCanvas({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 h-dvh w-dvw overflow-hidden">
      <MapProvider>{children}</MapProvider>
    </div>
  );
}
