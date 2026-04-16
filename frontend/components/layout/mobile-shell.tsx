import type { PropsWithChildren, ReactNode } from "react";

import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { ModeNav } from "@/components/layout/mode-nav";
import { TopHeader } from "@/components/layout/top-header";
import { cn } from "@/lib/utils/cn";

interface MobileShellProps {
  activeMode?: "feed" | "place" | "person" | "event" | "chat";
  activeTab?: "likes" | "contribute" | "conversations" | "relations" | "profile";
  headerRight?: ReactNode;
  className?: string;
  showBottomBar?: boolean;
  showModeNav?: boolean;
}

export function MobileShell({
  children,
  activeMode = "feed",
  activeTab = "relations",
  headerRight,
  className,
  showBottomBar = true,
  showModeNav = true,
}: PropsWithChildren<MobileShellProps>) {
  return (
    <div className="min-h-screen bg-halo px-3 py-4 text-ink">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-shell border border-white/60 bg-shell shadow-card">
        <div className="sticky top-0 z-40">
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
            "flex-1 overflow-y-auto overscroll-contain scroll-smooth",
            // Establish a stacking context that doesn't clip 3D children
            "isolate",
            className
          )}
        >
          {children}
        </main>

        {showBottomBar ? <BottomTabBar activeTab={activeTab} /> : null}
      </div>
    </div>
  );
}
