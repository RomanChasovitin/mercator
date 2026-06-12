"use client";

import { useSyncExternalStore } from "react";

export function useMediaQuery(query: string) {
  const subscribe = (onStoreChange: () => void) => {
    const mediaQuery = window.matchMedia(query);
    mediaQuery.addEventListener("change", onStoreChange);
    return () => mediaQuery.removeEventListener("change", onStoreChange);
  };

  const getSnapshot = () =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false;

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
