"use client";

import maplibregl from "maplibre-gl";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { codexStyle, LAND_LAYER, LAND_OUTLINE_LAYER } from "@/lib/map/style";

type MapCtx = { map: maplibregl.Map | null; ready: boolean };
const Ctx = createContext<MapCtx>({ map: null, ready: false });
export const useMap = () => useContext(Ctx);

const WORLD_VIEW = { center: [10, 25] as [number, number], zoom: 1.4 };

async function addWorldLayers(map: maplibregl.Map) {
  if (map.getSource("world")) return;
  const res = await fetch("/geo/world.geojson");
  if (!res.ok) throw new Error(`Failed to load world GeoJSON (${res.status})`);
  const data = await res.json();
  map.addSource("world", { type: "geojson", data });
  map.addLayer(LAND_LAYER);
  map.addLayer(LAND_OUTLINE_LAYER);
}

export function MapProvider({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    const map = new maplibregl.Map({
      container,
      style: codexStyle,
      center: WORLD_VIEW.center,
      zoom: WORLD_VIEW.zoom,
      attributionControl: { compact: true },
      dragRotate: false,
    });

    const finish = () => {
      if (cancelled) return;
      map.resize();
      setReady(true);
    };

    map.on("load", () => {
      addWorldLayers(map)
        .catch((err) => console.error("Mercator: failed to add world layers", err))
        .finally(finish);
    });

    map.on("error", (e) => console.error("Mercator: MapLibre error", e));

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(container);

    mapRef.current = map;
    setMap(map);

    return () => {
      cancelled = true;
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      setMap(null);
      setReady(false);
    };
  }, []);

  return (
    <Ctx.Provider value={{ map, ready }}>
      <div className="relative h-full w-full">
        <div ref={containerRef} className="absolute inset-0 h-full w-full" />
        {children}
      </div>
    </Ctx.Provider>
  );
}

export { WORLD_VIEW };
