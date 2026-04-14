"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Contributor } from "@/lib/api/types";

interface AuthState {
  token: string | null;
  user: Contributor | null;
  setSession: (token: string, user: Contributor) => void;
  setUser: (user: Contributor) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      setUser: (user) => set((state) => ({ ...state, user })),
      clearSession: () => set({ token: null, user: null })
    }),
    {
      name: "lela-auth"
    }
  )
);
