import { CalendarDays, Crosshair, Menu } from "lucide-react";
import type { ReactNode } from "react";

interface TopHeaderProps {
  rightContent?: ReactNode;
}

export function TopHeader({ rightContent }: TopHeaderProps) {
  return (
    <header className="border-b border-borderSoft bg-white/85 px-4 py-3 backdrop-blur">
      <div className="flex items-center justify-between gap-3 text-sm text-graphite">
        <div className="flex items-center gap-2">
          <Crosshair className="h-4 w-4" />
          <span className="underline decoration-1 underline-offset-2">Strasbourg</span>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          <span>5 avril 2026</span>
        </div>
        {rightContent ?? <Menu className="h-5 w-5" />}
      </div>
    </header>
  );
}

