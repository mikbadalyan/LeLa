"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { LogoMark } from "@/components/ui/logo-mark";
import { useChatStore } from "@/features/chat/store";
import { useI18n } from "@/features/shell/i18n";
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
  const router = useRouter();
  const startNewConversation = useChatStore((state) => state.startNewConversation);
  const { t } = useI18n();

  return (
    <div className="border-b border-borderSoft bg-[#E8E4DF] px-4 pt-4">
      <div className="flex items-end gap-4">
        <Link href="/feed" className="flex flex-col items-center gap-2 pb-1" aria-label={t("modes.feed")}>
          <LogoMark />
          <span
            className={cn(
              "h-0 w-0 border-x-[9px] border-x-transparent border-b-[10px] transition",
              activeMode === "feed" ? "border-b-[#4F79FF]" : "border-b-transparent"
            )}
          />
        </Link>
        <nav className="flex flex-1 items-end justify-between gap-2">
          {items.map(({ key, href, icon, label }) => {
            const isActive = key === activeMode;
            const handleClick = () => {
              if (key === "chat") {
                startNewConversation();
                router.push("/feed?focus=chat");
              }
            };
            const translatedLabel =
              key === "place"
                ? t("modes.places")
                : key === "person"
                  ? t("modes.people")
                  : key === "event"
                    ? t("modes.events")
                    : t("modes.chat");
            return (
              <Link
                key={key}
                href={href}
                onClick={handleClick}
                className={cn(
                  "flex min-w-[48px] flex-col items-center gap-2 rounded-b-[20px] px-2 pb-1 transition",
                  isActive ? "bg-white/25" : "hover:bg-white/15"
                )}
                aria-label={translatedLabel || label}
              >
                <Image
                  src={icon}
                  alt={translatedLabel || label}
                  width={25}
                  height={25}
                  className={cn("h-6 w-auto opacity-90 transition", isActive && "brightness-110")}
                />
                <span
                  className={cn(
                    "h-0 w-0 border-x-[9px] border-x-transparent border-b-[10px] transition",
                    isActive ? "border-b-[#4F79FF]" : "border-b-transparent"
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
