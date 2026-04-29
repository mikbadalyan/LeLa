"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { LogoMark } from "@/components/ui/logo-mark";
import { ModeIcon } from "@/components/ui/lela-icons";
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

  return (
    <div className="h-[var(--pwa-category-nav-height)] border-b border-black/5 bg-[var(--pwa-bg)] px-[22px]">
      <div className="grid h-full grid-cols-[62px_minmax(0,1fr)] items-center gap-6">
        <Link
          href="/feed"
          className="relative flex h-full w-[62px] shrink-0 flex-col items-center justify-center"
          aria-label={t("modes.feed")}
        >
          <LogoMark className="h-[58px] w-[58px] border border-[#8D36FF] bg-white shadow-[inset_0_0_0_1px_rgba(141,54,255,0.12),0_1px_2px_rgba(0,0,0,0.04)]" large />
          <span
            className={cn(
              "absolute bottom-0 h-0 w-0 border-b-[8px] border-x-[8px] border-x-transparent transition",
              activeMode === "feed" ? "border-b-[#414652]" : "border-b-transparent"
            )}
          />
        </Link>
        <nav className="grid h-full grid-cols-4 items-center">
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
                  "relative flex h-[var(--pwa-category-nav-height)] min-w-0 flex-col items-center justify-center transition",
                  isActive ? "text-[var(--pwa-blue)]" : "text-[#454A55] hover:text-[var(--pwa-blue)]"
                )}
                aria-label={translatedLabel || label}
              >
                <ModeIcon
                  mode={key}
                  className={cn(
                    "h-[28px] w-[28px] transition",
                    isActive ? "text-[var(--pwa-blue)]" : "text-[#454A55]"
                  )}
                  strokeWidth={2.9}
                />
                <span
                  className={cn(
                    "absolute bottom-0 h-0 w-0 border-b-[8px] border-x-[8px] border-x-transparent transition",
                    isActive ? "border-b-[var(--pwa-blue)]" : "border-b-transparent"
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
