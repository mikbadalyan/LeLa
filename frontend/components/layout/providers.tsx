"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useEffect, useState, type ReactNode } from "react";

import { useAuthStore } from "@/features/auth/store";
import { useShellStore } from "@/features/shell/store";
import { PwaRegistration } from "@/lib/hooks/use-pwa";

const ReactQueryDevtools =
  process.env.NODE_ENV === "development"
    ? dynamic(
        () =>
          import("@tanstack/react-query-devtools").then((module) => module.ReactQueryDevtools),
        { ssr: false }
      )
    : null;

function ShellPreferencesController() {
  const userSettings = useAuthStore((state) => state.user?.settings);
  const language = useShellStore((state) => state.language);
  const themeMode = useShellStore((state) => state.themeMode);
  const reduceMotion = useShellStore((state) => state.reduceMotion);
  const largeText = useShellStore((state) => state.largeText);
  const highContrast = useShellStore((state) => state.highContrast);
  const setLanguage = useShellStore((state) => state.setLanguage);
  const setThemeMode = useShellStore((state) => state.setThemeMode);
  const setCompactMode = useShellStore((state) => state.setCompactMode);
  const setAutoplayPreviews = useShellStore((state) => state.setAutoplayPreviews);
  const setReduceMotion = useShellStore((state) => state.setReduceMotion);
  const setLargeText = useShellStore((state) => state.setLargeText);
  const setHighContrast = useShellStore((state) => state.setHighContrast);
  const setSoundEffects = useShellStore((state) => state.setSoundEffects);
  const setDataSaver = useShellStore((state) => state.setDataSaver);

  useEffect(() => {
    if (!userSettings) {
      return;
    }

    setLanguage(userSettings.interface_language);
    setThemeMode(userSettings.theme_preference);
    setCompactMode(userSettings.compact_mode);
    setAutoplayPreviews(userSettings.autoplay_previews);
    setReduceMotion(userSettings.reduce_motion);
    setLargeText(userSettings.large_text);
    setHighContrast(userSettings.high_contrast);
    setSoundEffects(userSettings.sound_effects);
    setDataSaver(userSettings.data_saver);
  }, [
    setAutoplayPreviews,
    setCompactMode,
    setDataSaver,
    setHighContrast,
    setLanguage,
    setLargeText,
    setReduceMotion,
    setSoundEffects,
    setThemeMode,
    userSettings,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const root = document.documentElement;
    root.lang = language;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      const resolvedTheme =
        themeMode === "system" ? (mediaQuery.matches ? "dark" : "light") : themeMode;

      root.dataset.theme = resolvedTheme;
      root.dataset.motion = reduceMotion ? "reduce" : "normal";
      root.dataset.textScale = largeText ? "large" : "normal";
      root.dataset.contrast = highContrast ? "high" : "normal";
      root.style.colorScheme = resolvedTheme;
    };

    applyTheme();

    if (themeMode !== "system") {
      return;
    }

    const handleChange = () => applyTheme();
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [highContrast, language, largeText, reduceMotion, themeMode]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false
          }
        }
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ShellPreferencesController />
      <PwaRegistration />
      {children}
      {ReactQueryDevtools ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  );
}
