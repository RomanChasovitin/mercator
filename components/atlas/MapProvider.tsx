"use client";

import maplibregl from "maplibre-gl";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { codexStyle } from "@/lib/map/style";

type MapCtx = { map: maplibregl.Map | null; ready: boolean };
const Ctx = createContext<MapCtx>({ map: null, ready: false });
export const useMap = () => useContext(Ctx);

const WORLD_VIEW = { center: [10, 25] as [number, number], zoom: 1.4 };

export function MapProvider({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: codexStyle,
      center: WORLD_VIEW.center,
      zoom: WORLD_VIEW.zoom,
      attributionControl: { compact: true },
      dragRotate: false,
    });
    map.on("load", () => setReady(true));
    mapRef.current = map;
    setMap(map);
    return () => {
      map.remove();
      mapRef.current = null;
      setMap(null);
    };
  }, []);

  return (
    <Ctx.Provider value={{ map, ready }}>
      <div ref={containerRef} className="absolute inset-0" />
      {ready && children}
    </Ctx.Provider>
  );
}

export { WORLD_VIEW };
