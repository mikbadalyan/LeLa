"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ShellState {
  city: string;
  selectedDate: string;
  setCity: (city: string) => void;
  setSelectedDate: (selectedDate: string) => void;
  resetFilters: () => void;
}

const DEFAULT_CITY = "Strasbourg";
const DEFAULT_DATE = "2026-04-05";

export const useShellStore = create<ShellState>()(
  persist(
    (set) => ({
      city: DEFAULT_CITY,
      selectedDate: DEFAULT_DATE,
      setCity: (city) => set({ city: city.trim() || DEFAULT_CITY }),
      setSelectedDate: (selectedDate) => set({ selectedDate: selectedDate || DEFAULT_DATE }),
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
};
