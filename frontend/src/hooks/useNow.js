import { useSyncExternalStore } from "react";
import { getNow, subscribeTicker } from "../lib/ticker";

/** Current unix time in seconds, updated once per second. */
export function useNow() {
  return useSyncExternalStore(subscribeTicker, getNow, getNow);
}
