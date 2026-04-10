"use client";

import Image from "next/image";
import Link from "next/link";
import { UserCircle2 } from "lucide-react";

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
  { key: "likes", href: "/feed?tab=likes", label: "Aimes", icon: "/assets/icon-tab-heart.svg" },
  { key: "contribute", href: "/contribute", label: "Contributions", icon: "/assets/icon-plus-navbar.svg" },
  {
    key: "conversations",
    href: "/feed?tab=conversations",
    label: "Conversations",
    icon: "/assets/icon-chat.svg"
  },
  { key: "relations", href: "/feed", label: "Relations", icon: "/assets/icon-relations.svg" },
  { key: "profile", href: "/profile", label: "Compte" }
];

export function BottomTabBar({ activeTab }: BottomTabBarProps) {
  return (
    <nav className="grid grid-cols-5 gap-2 bg-plum px-2 py-2 text-white">
      {items.map(({ key, href, label, icon }) => {
        const isActive = key === activeTab;
        return (
          <Link
            key={key}
            href={href}
            className={cn(
              "flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-center text-[11px] font-medium transition",
              isActive ? "bg-white/12" : "opacity-90"
            )}
          >
            {icon ? (
              <Image src={icon} alt={label} width={25} height={25} className="h-5 w-auto" />
            ) : (
              <UserCircle2 className="h-5 w-5" />
            )}
            <span className="leading-tight">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
