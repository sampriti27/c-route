"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import type { ProfileResponse } from "./types";
import {
  SAMPLE_EXTRACTED_SKILLS,
  SAMPLE_BACKGROUND_TEXT,
  type ExtractedSkill,
} from "./mock-data";

const STORAGE_KEY = "croute:result";
const SELECTED_ROUTE_KEY = "croute:selected-route";
const CHANGE_EVENT = "croute:result-changed";

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

export interface UserProfileInput {
  name: string;
  background: string;
  currentRole: string;
  targetDirection: string;
}

interface AppState {
  result: ProfileResponse | null;
  effectiveResult: ProfileResponse | null;
  setResult: (result: ProfileResponse | null) => void;
  selectedRouteId: string;
  setSelectedRouteId: (id: string) => void;
  extractedSkills: ExtractedSkill[];
  setExtractedSkills: (skills: ExtractedSkill[]) => void;
  userProfile: UserProfileInput;
  setUserProfile: (profile: UserProfileInput) => void;
  loadSampleProfile: () => void;
  reset: () => void;
}

const AppStoreContext = createContext<AppState | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const storedResult = useSyncExternalStore(subscribe, readStoredResult, getServerSnapshot);

  const [selectedRouteId, setSelectedRouteIdState] = useState<string>("");

  // Sync from localStorage after mount so the initial client render matches SSR.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SELECTED_ROUTE_KEY);
      if (stored) {
        setSelectedRouteIdState(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  const [extractedSkills, setExtractedSkills] = useState<ExtractedSkill[]>([]);

  const [userProfile, setUserProfile] = useState<UserProfileInput>({
    name: "",
    background: "",
    currentRole: "",
    targetDirection: "",
  });

  const setResult = useCallback((next: ProfileResponse | null) => {
    try {
      if (next) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore quota / private browsing errors
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const setSelectedRouteId = useCallback((id: string) => {
    setSelectedRouteIdState(id);
    try {
      window.localStorage.setItem(SELECTED_ROUTE_KEY, id);
    } catch {
      // ignore
    }
  }, []);

  // Prefills the FORM only — this is a demo-speed convenience, not a fake API
  // response. The user still has to submit the form to hit the real backend.
  const loadSampleProfile = useCallback(() => {
    setUserProfile({
      name: "Aisha",
      background: SAMPLE_BACKGROUND_TEXT,
      currentRole: "Junior Finance Executive",
      targetDirection: "Analytics / Data",
    });
    setExtractedSkills(SAMPLE_EXTRACTED_SKILLS);
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setUserProfile({
      name: "",
      background: "",
      currentRole: "",
      targetDirection: "",
    });
    setExtractedSkills([]);
  }, [setResult]);

  const effectiveResult = storedResult;

  return (
    <AppStoreContext.Provider
      value={{
        result: storedResult,
        effectiveResult,
        setResult,
        selectedRouteId,
        setSelectedRouteId,
        extractedSkills,
        setExtractedSkills,
        userProfile,
        setUserProfile,
        loadSampleProfile,
        reset,
      }}
    >
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
