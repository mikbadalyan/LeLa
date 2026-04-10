"use client";

import { create } from "zustand";

import type { EditorialType } from "@/lib/api/types";

type FeedFilter = "all" | EditorialType;

interface FeedUiState {
  filter: FeedFilter;
  scrollY: number;
  setFilter: (filter: FeedFilter) => void;
  setScrollY: (scrollY: number) => void;
}

export const useFeedUiStore = create<FeedUiState>((set) => ({
  filter: "all",
  scrollY: 0,
  setFilter: (filter) => set({ filter }),
  setScrollY: (scrollY) => set({ scrollY })
}));

