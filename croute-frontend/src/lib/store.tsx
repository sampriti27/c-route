"use client";

import { createContext, useCallback, useContext, useSyncExternalStore, type ReactNode } from "react";

import type { ProfileResponse } from "./types";

const STORAGE_KEY = "croute:result";
const CHANGE_EVENT = "croute:result-changed";

// Module-level cache so getSnapshot returns a stable reference until the
// underlying localStorage value actually changes (required by useSyncExternalStore).
let cachedRaw: string | null = null;
let cachedResult: ProfileResponse | null = null;

function readStoredResult(): ProfileResponse | null {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedResult = raw ? (JSON.parse(raw) as ProfileResponse) : null;
    } catch {
      cachedResult = null;
    }
  }
  return cachedResult;
}

// SSR has no localStorage — React renders this on the server and again on the
// client's first pass, then swaps to readStoredResult() once mounted.
function getServerSnapshot(): ProfileResponse | null {
  return null;
}

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

interface AppState {
  result: ProfileResponse | null;
  setResult: (result: ProfileResponse | null) => void;
  reset: () => void;
}

const AppStoreContext = createContext<AppState | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const result = useSyncExternalStore(subscribe, readStoredResult, getServerSnapshot);

  const setResult = useCallback((next: ProfileResponse | null) => {
    try {
      if (next) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore storage write failures (private browsing, quota)
    }
    // Same-tab localStorage writes don't fire the native "storage" event, so
    // notify this tab's subscribers explicitly.
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const reset = useCallback(() => setResult(null), [setResult]);

  return (
    <AppStoreContext.Provider value={{ result, setResult, reset }}>
      {children}
    </AppStoreContext.Provider>
  );
}

export function useAppStore(): AppState {
  const ctx = useContext(AppStoreContext);
  if (!ctx) {
    throw new Error("useAppStore must be used within an AppStoreProvider");
  }
  return ctx;
}
