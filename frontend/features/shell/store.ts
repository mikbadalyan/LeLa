"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ShellState {
  city: string;
  selectedDate: string;
  language: "fr" | "hy" | "en" | "de";
  themeMode: "system" | "light" | "dark";
  compactMode: boolean;
  autoplayPreviews: boolean;
  reduceMotion: boolean;
  largeText: boolean;
  highContrast: boolean;
  soundEffects: boolean;
  dataSaver: boolean;
  setCity: (city: string) => void;
  setSelectedDate: (selectedDate: string) => void;
  setLanguage: (language: "fr" | "hy" | "en" | "de") => void;
  setThemeMode: (themeMode: "system" | "light" | "dark") => void;
  setCompactMode: (compactMode: boolean) => void;
  setAutoplayPreviews: (autoplayPreviews: boolean) => void;
  setReduceMotion: (reduceMotion: boolean) => void;
  setLargeText: (largeText: boolean) => void;
  setHighContrast: (highContrast: boolean) => void;
  setSoundEffects: (soundEffects: boolean) => void;
  setDataSaver: (dataSaver: boolean) => void;
  resetFilters: () => void;
}

const DEFAULT_CITY = "Strasbourg";
const DEFAULT_DATE = "2026-04-05";
const DEFAULT_LANGUAGE = "fr";
const DEFAULT_THEME_MODE = "system";
const DEFAULT_COMPACT_MODE = true;
const DEFAULT_AUTOPLAY_PREVIEWS = false;
const DEFAULT_REDUCE_MOTION = false;
const DEFAULT_LARGE_TEXT = false;
const DEFAULT_HIGH_CONTRAST = false;
const DEFAULT_SOUND_EFFECTS = true;
const DEFAULT_DATA_SAVER = false;

export const useShellStore = create<ShellState>()(
  persist(
    (set) => ({
      city: DEFAULT_CITY,
      selectedDate: DEFAULT_DATE,
      language: DEFAULT_LANGUAGE,
      themeMode: DEFAULT_THEME_MODE,
      compactMode: DEFAULT_COMPACT_MODE,
      autoplayPreviews: DEFAULT_AUTOPLAY_PREVIEWS,
      reduceMotion: DEFAULT_REDUCE_MOTION,
      largeText: DEFAULT_LARGE_TEXT,
      highContrast: DEFAULT_HIGH_CONTRAST,
      soundEffects: DEFAULT_SOUND_EFFECTS,
      dataSaver: DEFAULT_DATA_SAVER,
      setCity: (city) => set({ city: city.trim() || DEFAULT_CITY }),
      setSelectedDate: (selectedDate) => set({ selectedDate: selectedDate || DEFAULT_DATE }),
      setLanguage: (language) => set({ language }),
      setThemeMode: (themeMode) => set({ themeMode }),
      setCompactMode: (compactMode) => set({ compactMode }),
      setAutoplayPreviews: (autoplayPreviews) => set({ autoplayPreviews }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
      setLargeText: (largeText) => set({ largeText }),
      setHighContrast: (highContrast) => set({ highContrast }),
      setSoundEffects: (soundEffects) => set({ soundEffects }),
      setDataSaver: (dataSaver) => set({ dataSaver }),
      resetFilters: () => set({ city: DEFAULT_CITY, selectedDate: DEFAULT_DATE }),
    }),
    {
      name: "lela-shell",
    }
  )
);

export const shellDefaults = {
  city: DEFAULT_CITY,
  selectedDate: DEFAULT_DATE,
  language: DEFAULT_LANGUAGE,
  themeMode: DEFAULT_THEME_MODE,
  compactMode: DEFAULT_COMPACT_MODE,
  autoplayPreviews: DEFAULT_AUTOPLAY_PREVIEWS,
  reduceMotion: DEFAULT_REDUCE_MOTION,
  largeText: DEFAULT_LARGE_TEXT,
  highContrast: DEFAULT_HIGH_CONTRAST,
  soundEffects: DEFAULT_SOUND_EFFECTS,
  dataSaver: DEFAULT_DATA_SAVER,
} as const;
