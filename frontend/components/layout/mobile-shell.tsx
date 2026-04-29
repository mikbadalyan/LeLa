"use client";

import type { PropsWithChildren, ReactNode } from "react";

import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { ModeNav } from "@/components/layout/mode-nav";
import { TopHeader } from "@/components/layout/top-header";
import { useShellStore } from "@/features/shell/store";
import { cn } from "@/lib/utils/cn";

interface MobileShellProps {
  activeMode?: "feed" | "place" | "person" | "event" | "chat";
  activeTab?: "likes" | "contribute" | "conversations" | "relations" | "profile";
  headerRight?: ReactNode;
  className?: string;
  showBottomBar?: boolean;
  showModeNav?: boolean;
  padForBottomBar?: boolean;
}

export function MobileShell({
  children,
  activeMode = "feed",
  activeTab = "relations",
  headerRight,
  className,
  showBottomBar = true,
  showModeNav = true,
  padForBottomBar = true,
}: PropsWithChildren<MobileShellProps>) {
  const compactMode = useShellStore((state) => state.compactMode);

  return (
    <div
      className={cn(
        "flex min-h-dvh items-stretch justify-center bg-[#E9E9E9] text-ink md:px-3",
        compactMode ? "md:py-3" : "md:py-5"
      )}
    >
      <div className="relative w-full max-w-[390px]">
        <div
          className={cn(
            "pwa-no-bold relative mx-auto flex min-h-dvh w-full flex-col overflow-hidden bg-[#E9E9E9] shadow-none ring-0",
            compactMode
              ? "md:h-[844px] md:min-h-[844px] md:max-h-[844px] md:rounded-[30px] md:shadow-card md:ring-1 md:ring-borderSoft/10"
              : "md:h-[844px] md:min-h-[844px] md:max-h-[844px] md:rounded-[34px] md:shadow-card md:ring-1 md:ring-borderSoft/10"
          )}
        >
          <div className="sticky top-0 z-50 shrink-0">
            <TopHeader rightContent={headerRight} />
            {showModeNav ? <ModeNav activeMode={activeMode} /> : null}
          </div>

          {/*
            overflow-y-auto is kept for scrolling.
            We do NOT use overflow-hidden here so that card 3D flip transforms
            are not clipped by the scroll container.
          */}
          <main
            id="lela-scroll-container"
            className={cn(
              "min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-smooth",
              showBottomBar && padForBottomBar ? "pb-[calc(var(--pwa-bottom-nav-height)+8px+env(safe-area-inset-bottom))]" : "",
              "isolate",
              className
            )}
          >
            {children}
          </main>

          {showBottomBar ? <BottomTabBar activeTab={activeTab} /> : null}
        </div>
      </div>
    </div>
  );
}
