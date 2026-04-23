import type { LucideProps } from "lucide-react";
import {
  BookOpenText,
  CalendarDays,
  Cloud,
  Headphones,
  Heart,
  Filter,
  MapPin,
  MessageCircleMore,
  Network,
  Newspaper,
  Pause,
  PlusCircle,
  Send,
  UserCircle2,
  Users,
} from "lucide-react";

import type { EditorialCard } from "@/lib/api/types";

type IconProps = Omit<LucideProps, "ref">;

function RobotChatAsset({ className }: { className?: string }) {
  return (
    <img
      src="/assets/icon-chat-good.svg"
      alt=""
      aria-hidden="true"
      className={className}
    />
  );
}

export function ModeIcon({
  mode,
  ...props
}: IconProps & { mode: "place" | "person" | "event" | "chat" }) {
  switch (mode) {
    case "place":
      return <MapPin {...props} />;
    case "person":
      return <Users {...props} />;
    case "event":
      return <CalendarDays {...props} />;
    case "chat":
      return <RobotChatAsset className={props.className} />;
  }
}

export function TabIcon({
  tab,
  ...props
}: IconProps & {
  tab: "likes" | "contribute" | "conversations" | "relations" | "profile";
}) {
  switch (tab) {
    case "likes":
      return <Heart {...props} />;
    case "contribute":
      return <PlusCircle {...props} />;
    case "conversations":
      return <MessageCircleMore {...props} />;
    case "relations":
      return <Network {...props} />;
    case "profile":
      return <UserCircle2 {...props} />;
  }
}

export function EditorialTypeIcon({
  type,
  ...props
}: IconProps & { type: EditorialCard["type"] | "magazine" | "place" | "person" | "event" }) {
  switch (type) {
    case "magazine":
      return <Newspaper {...props} />;
    case "place":
      return <MapPin {...props} />;
    case "person":
      return <Users {...props} />;
    case "event":
      return <CalendarDays {...props} />;
  }
}

export function MediaStateIcon({
  kind,
  isPlaying,
  ...props
}: IconProps & {
  kind: "image" | "video" | "audio" | "read";
  isPlaying?: boolean;
}) {
  if (isPlaying) {
    return <Pause {...props} />;
  }

  switch (kind) {
    case "video":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.15-5.18a1 1 0 0 0 0-1.68L9.54 5.98A1 1 0 0 0 8 6.82Z" />
        </svg>
      );
    case "audio":
      return <Headphones {...props} />;
    case "image":
    case "read":
      return <BookOpenText {...props} />;
  }
}

export function ShareIcon(props: IconProps) {
  return <Send {...props} />;
}

export function CloudIcon(props: IconProps) {
  return <Cloud {...props} />;
}

export function FilterIcon(props: IconProps) {
  return <Filter {...props} />;
}
