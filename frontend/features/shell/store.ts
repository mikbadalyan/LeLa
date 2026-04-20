"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ShellState {
  city: string;
  selectedDate: string;
  language: "fr" | "hy" | "en" | "de";
  setCity: (city: string) => void;
  setSelectedDate: (selectedDate: string) => void;
  setLanguage: (language: "fr" | "hy" | "en" | "de") => void;
  resetFilters: () => void;
}

const DEFAULT_CITY = "Strasbourg";
const DEFAULT_DATE = "2026-04-05";
const DEFAULT_LANGUAGE = "fr";

export const useShellStore = create<ShellState>()(
  persist(
    (set) => ({
      city: DEFAULT_CITY,
      selectedDate: DEFAULT_DATE,
      language: DEFAULT_LANGUAGE,
      setCity: (city) => set({ city: city.trim() || DEFAULT_CITY }),
      setSelectedDate: (selectedDate) => set({ selectedDate: selectedDate || DEFAULT_DATE }),
      setLanguage: (language) => set({ language }),
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
};
