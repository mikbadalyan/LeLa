"use client";

import Image from "next/image";
import Link from "next/link";

import { LogoMark } from "@/components/ui/logo-mark";
import { cn } from "@/lib/utils/cn";

type Mode = "place" | "person" | "event" | "chat";

interface ModeNavProps {
  activeMode: "feed" | Mode;
}

const items: Array<{
  key: Mode;
  href: string;
  icon: string;
  label: string;
}> = [
  { key: "place", href: "/feed?focus=place", icon: "/assets/icon-location.svg", label: "Lieux" },
  { key: "person", href: "/feed?focus=person", icon: "/assets/icon-actors.svg", label: "Acteurs" },
  { key: "event", href: "/feed?focus=event", icon: "/assets/icon-event.svg", label: "Evenements" },
  { key: "chat", href: "/feed?focus=chat", icon: "/assets/icon-chat.svg", label: "Chat" }
];

export function ModeNav({ activeMode }: ModeNavProps) {
  return (
    <div className="border-b border-borderSoft bg-[#E8E4DF] px-4 pt-4">
      <div className="flex items-center gap-4">
        <LogoMark />
        <nav className="flex flex-1 items-end justify-between">
          {items.map(({ key, href, icon, label }) => {
            const isActive = key === activeMode;
            return (
              <Link
                key={key}
                href={href}
                className="flex flex-col items-center gap-2 pb-2"
                aria-label={label}
              >
                <Image
                  src={icon}
                  alt={label}
                  width={25}
                  height={25}
                  className={cn("h-6 w-auto opacity-90 transition", isActive && "brightness-110")}
                />
                <span
                  className={cn(
                    "h-1.5 w-12 rounded-full transition",
                    isActive ? "bg-[#4F79FF]" : "bg-transparent"
                  )}
                />
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
