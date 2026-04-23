"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { LogoMark } from "@/components/ui/logo-mark";
import { ModeIcon } from "@/components/ui/lela-icons";
import { useChatStore } from "@/features/chat/store";
import { useI18n } from "@/features/shell/i18n";
import { useShellStore } from "@/features/shell/store";
import { cn } from "@/lib/utils/cn";

type Mode = "place" | "person" | "event" | "chat";

interface ModeNavProps {
  activeMode: "feed" | Mode;
}

const items: Array<{
  key: Mode;
  href: string;
  label: string;
}> = [
  { key: "place", href: "/feed?focus=place", label: "Lieux" },
  { key: "person", href: "/feed?focus=person", label: "Acteurs" },
  { key: "event", href: "/feed?focus=event", label: "Evenements" },
  { key: "chat", href: "/feed?focus=chat", label: "Chat" }
];

export function ModeNav({ activeMode }: ModeNavProps) {
  const router = useRouter();
  const startNewConversation = useChatStore((state) => state.startNewConversation);
  const { t } = useI18n();
  const compactMode = useShellStore((state) => state.compactMode);

  return (
    <div className={cn("border-b border-borderSoft/10 bg-shell/96 backdrop-blur-xl", compactMode ? "px-4 pt-2 pb-1" : "px-4 pt-2.5 pb-1.5")}>
      <div className={cn("flex items-center gap-3", compactMode ? "" : "gap-4")}>
        <Link href="/feed" className="flex min-h-[58px] flex-col items-center justify-center gap-1.5" aria-label={t("modes.feed")}>
          <LogoMark />
          <span
            className={cn(
              "h-0 w-0 border-b-[10px] border-x-[9px] border-x-transparent transition",
              activeMode === "feed" ? "border-b-blue" : "border-b-transparent"
            )}
          />
        </Link>
        <nav className="flex flex-1 items-center justify-between gap-2">
          {items.map(({ key, href, label }) => {
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
                  "relative flex min-h-[58px] min-w-[48px] flex-col items-center justify-center overflow-hidden rounded-t-[18px] px-2 pb-1 transition before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top,rgba(51,101,200,0.18),transparent_70%)] before:opacity-0 before:transition before:duration-300",
                  compactMode ? "gap-1.5" : "gap-2",
                  isActive ? "bg-blueSoft/70 before:opacity-100" : "hover:bg-white/45"
                )}
                aria-label={translatedLabel || label}
              >
                <ModeIcon
                  mode={key}
                  className={cn(
                    compactMode ? "h-[22px] w-[22px] transition" : "h-6 w-6 transition",
                    isActive ? "scale-[1.06] text-blue" : "text-[#525764]"
                  )}
                />
                <span
                  className={cn(
                    "h-0 w-0 border-b-[10px] border-x-[9px] border-x-transparent transition",
                    isActive ? "border-b-blue" : "border-b-transparent"
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
