"use client";

import Image from "next/image";
import Link from "next/link";
import { UserCircle2 } from "lucide-react";

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
  icon?: string;
}> = [
  { key: "likes", href: "/likes", label: "Aimes", icon: "/assets/icon-tab-heart.svg" },
  { key: "contribute", href: "/contribute", label: "Contributions", icon: "/assets/icon-plus-navbar.svg" },
  {
    key: "conversations",
    href: "/conversations",
    label: "Conversations",
    icon: "/assets/icon-chat.svg"
  },
  { key: "relations", href: "/relations", label: "Relations", icon: "/assets/icon-relations.svg" },
  { key: "profile", href: "/profile", label: "Compte" }
];

export function BottomTabBar({ activeTab }: BottomTabBarProps) {
  const { t } = useI18n();

  const labels: Record<Tab, string> = {
    likes: t("tabs.likes"),
    contribute: t("tabs.contribute"),
    conversations: t("tabs.conversations"),
    relations: t("tabs.relations"),
    profile: t("tabs.profile"),
  };

  return (
    <nav className="sticky bottom-0 z-40 grid shrink-0 grid-cols-5 gap-2 border-t border-white/10 bg-plum/95 px-2 pb-[max(env(safe-area-inset-bottom),0.85rem)] pt-3 text-white backdrop-blur-md">
      {items.map(({ key, href, label, icon }) => {
        const isActive = key === activeTab;
        const translatedLabel = labels[key] ?? label;
        return (
          <Link
            key={key}
            href={href}
            className={cn(
              "flex min-h-[66px] flex-col items-center justify-center gap-1.5 rounded-2xl px-1 py-2.5 text-center text-[11px] font-medium transition",
              isActive ? "bg-white/14 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]" : "opacity-90 hover:bg-white/7"
            )}
          >
            {icon ? (
              <Image src={icon} alt={translatedLabel} width={25} height={25} className="h-[22px] w-auto" />
            ) : (
              <UserCircle2 className="h-[22px] w-[22px]" />
            )}
            <span className="leading-tight">{translatedLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}
