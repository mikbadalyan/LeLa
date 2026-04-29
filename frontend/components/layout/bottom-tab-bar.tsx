"use client";

import Image from "next/image";
import Link from "next/link";

import { TabIcon } from "@/components/ui/lela-icons";
import { useAuthStore } from "@/features/auth/store";
import { useI18n } from "@/features/shell/i18n";
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
  const user = useAuthStore((state) => state.user);

  const labels: Record<Tab, string> = {
    likes: t("tabs.likes"),
    contribute: t("tabs.contribute"),
    conversations: t("tabs.conversations"),
    relations: t("tabs.relations"),
    profile: t("tabs.profile"),
  };

  return (
    <nav
      className="sticky bottom-0 z-50 grid h-[calc(var(--pwa-bottom-nav-height)+env(safe-area-inset-bottom))] shrink-0 grid-cols-5 bg-[var(--pwa-purple)] px-1 pb-[env(safe-area-inset-bottom)] text-white shadow-[0_-8px_18px_rgba(69,37,96,0.22)]"
    >
      {items.map(({ key, href, label }) => {
        const isActive = key === activeTab;
        const translatedLabel = labels[key] ?? label;
        return (
          <Link
            key={key}
            href={href}
            className={cn(
              "flex min-h-[var(--pwa-bottom-nav-height)] min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 text-center text-[10px] leading-none transition focus-visible:outline-white/40",
              isActive ? "opacity-100" : "opacity-95 hover:bg-white/8"
            )}
          >
            {key === "profile" && user?.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt={translatedLabel}
                width={24}
                height={24}
                className="h-6 w-6 rounded-full border border-white/75 object-cover"
              />
            ) : (
              <TabIcon
                tab={key}
                className={cn(
                  "h-6 w-6 text-white transition",
                  key === "likes" && "fill-current",
                  key === "profile" && "h-6 w-6"
                )}
                strokeWidth={key === "conversations" ? 3 : 2.7}
              />
            )}
            <span className="w-full truncate leading-tight">{translatedLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}
