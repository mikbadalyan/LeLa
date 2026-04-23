"use client";

import { create } from "zustand";

import type { EditorialType } from "@/lib/api/types";

type FeedFilter = "all" | EditorialType;

interface FeedUiState {
  filter: FeedFilter;
  mediaFilter: "all" | "video";
  scrollY: number;
  scrollProgress: number;
  setFilter: (filter: FeedFilter) => void;
  setMediaFilter: (mediaFilter: "all" | "video") => void;
  setScrollY: (scrollY: number) => void;
  setScrollProgress: (scrollProgress: number) => void;
}

export const useFeedUiStore = create<FeedUiState>((set) => ({
  filter: "all",
  mediaFilter: "all",
  scrollY: 0,
  scrollProgress: 0,
  setFilter: (filter) => set({ filter }),
  setMediaFilter: (mediaFilter) => set({ mediaFilter }),
  setScrollY: (scrollY) => set({ scrollY }),
  setScrollProgress: (scrollProgress) => set({ scrollProgress }),
}));
