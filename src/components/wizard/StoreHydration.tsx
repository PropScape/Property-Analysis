"use client";

import { useEffect } from "react";
import { useAnalysisStore } from "@/stores/analysis-store";

/**
 * Zustand hydration trigger for Next.js SSR.
 *
 * @remarks
 * The analysis store uses `skipHydration: true` to prevent a hydration
 * mismatch between the server-rendered HTML (which sees `initialState`)
 * and the client-side localStorage data.
 *
 * This tiny component is mounted in the wizard layout. It calls
 * `rehydrate()` inside `useEffect` — after the initial client render —
 * ensuring the store hydrates from localStorage only on the browser.
 *
 * Must be a Client Component (`"use client"`) because it calls a hook.
 * Returns `null` — renders nothing to the DOM.
 *
 * See ADR-005, Zustand docs §skipHydration.
 */
export function StoreHydration() {
  useEffect(() => {
    useAnalysisStore.persist.rehydrate();
  }, []);

  return null;
}
