"use client";

import Link from "next/link";

import { TabIcon } from "@/components/ui/lela-icons";
import { useI18n } from "@/features/shell/i18n";
import { useShellStore } from "@/features/shell/store";
import { cn } from "@/lib/utils/cn";

type Tab = "likes" | "contribute" | "conversations" | "relations" | "profile";

interface BottomTabBarProps {
  activeTab: Tab;
}

const items: Array<{
  key: Tab;
  href: string;
  label: string;
}> = [
  { key: "likes", href: "/likes", label: "Aimes" },
  { key: "contribute", href: "/contribute", label: "Contributions" },
  { key: "conversations", href: "/conversations", label: "Conversations" },
  { key: "relations", href: "/relations", label: "Relations" },
  { key: "profile", href: "/profile", label: "Compte" }
];

export function BottomTabBar({ activeTab }: BottomTabBarProps) {
  const { t } = useI18n();
  const compactMode = useShellStore((state) => state.compactMode);

  const labels: Record<Tab, string> = {
    likes: t("tabs.likes"),
    contribute: t("tabs.contribute"),
    conversations: t("tabs.conversations"),
    relations: t("tabs.relations"),
    profile: t("tabs.profile"),
  };

  return (
    <nav
      className={cn(
        "sticky bottom-0 z-50 grid shrink-0 grid-cols-5 gap-1.5 border-t border-white/12 bg-plum px-2 text-white shadow-[0_-18px_38px_rgba(35,25,48,0.18)] backdrop-blur-md",
        compactMode ? "pb-[max(env(safe-area-inset-bottom),0.8rem)] pt-2.5" : "pb-[max(env(safe-area-inset-bottom),1rem)] pt-3"
      )}
    >
      {items.map(({ key, href, label }) => {
        const isActive = key === activeTab;
        const translatedLabel = labels[key] ?? label;
        return (
          <Link
            key={key}
            href={href}
            className={cn(
              "flex flex-col items-center justify-center rounded-[18px] px-1 text-center text-[10.5px] font-semibold transition focus-visible:outline-white/40",
              compactMode ? "min-h-[58px] gap-1 py-2" : "min-h-[66px] gap-1.5 py-2.5",
              isActive ? "bg-white/16 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]" : "opacity-88 hover:bg-white/8"
            )}
          >
            <TabIcon
              tab={key}
              className={cn(
                compactMode ? "h-[21px] w-[21px] transition" : "h-[22px] w-[22px] transition",
                isActive ? "text-white" : "text-white/78",
                key === "likes" && isActive && "fill-current"
              )}
            />
            <span className="leading-tight">{translatedLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}
