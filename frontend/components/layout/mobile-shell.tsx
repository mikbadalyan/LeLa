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
  showModeNav = true
}: PropsWithChildren<MobileShellProps>) {
  return (
    <div className="min-h-screen bg-halo px-3 py-4 text-ink">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-shell border border-white/60 bg-shell shadow-card">
        <TopHeader rightContent={headerRight} />
        {showModeNav ? <ModeNav activeMode={activeMode} /> : null}
        <main id="lela-scroll-container" className={cn("flex-1 overflow-y-auto", className)}>
          {children}
        </main>
        {showBottomBar ? <BottomTabBar activeTab={activeTab} /> : null}
      </div>
    </div>
  );
}
