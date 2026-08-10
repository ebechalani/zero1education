"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * True after client hydration. Persisted stores (progress/session/studio) load
 * from localStorage on the client, so store-driven UI renders skeletons until
 * hydration to avoid SSR mismatches.
 */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true, // client snapshot
    () => false, // server snapshot
  );
}
