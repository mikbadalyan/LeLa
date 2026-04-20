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
    <div className="flex min-h-dvh items-stretch justify-center bg-[radial-gradient(circle_at_top,#f6efe8_0%,#ebe4dc_36%,#ddd5ca_100%)] text-ink md:px-4 md:py-6">
      <div className="relative w-full max-w-[430px]">
        <div className="relative mx-auto flex min-h-dvh w-full flex-col overflow-hidden bg-shell shadow-none md:min-h-[calc(100dvh-3rem)] md:max-h-[920px] md:rounded-[34px] md:shadow-[0_18px_48px_rgba(48,33,18,0.18)]">
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
              showBottomBar ? "pb-28" : "",
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
