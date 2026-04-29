import type { LucideProps } from "lucide-react";

import type { EditorialCard } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";

type IconProps = Omit<LucideProps, "ref">;

function SvgMaskIcon({
  src,
  className,
  style,
}: IconProps & { src: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block shrink-0 bg-current", className)}
      style={{
        WebkitMask: `url(${src}) center / contain no-repeat`,
        mask: `url(${src}) center / contain no-repeat`,
        ...style,
      }}
    />
  );
}

export function IconAsset(props: IconProps & { src: string }) {
  return <SvgMaskIcon {...props} />;
}

export function ModeIcon({
  mode,
  ...props
}: IconProps & { mode: "place" | "person" | "event" | "chat" }) {
  switch (mode) {
    case "place":
      return <SvgMaskIcon src="/icon/lieu.svg" {...props} />;
    case "person":
      return <SvgMaskIcon src="/icon/acteurs.svg" {...props} />;
    case "event":
      return <SvgMaskIcon src="/icon/event.svg" {...props} />;
    case "chat":
      return <SvgMaskIcon src="/icon/chat.svg" {...props} />;
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
      return <SvgMaskIcon src="/icon/likes.svg" {...props} />;
    case "contribute":
      return <SvgMaskIcon src="/icon/contributions.svg" {...props} />;
    case "conversations":
      return <SvgMaskIcon src="/icon/conversations.svg" {...props} />;
    case "relations":
      return <SvgMaskIcon src="/icon/relations.svg" {...props} />;
    case "profile":
      return <SvgMaskIcon src="/icon/compte.svg" {...props} />;
  }
}

export function EditorialTypeIcon({
  type,
  ...props
}: IconProps & { type: EditorialCard["type"] | "magazine" | "place" | "person" | "event" }) {
  switch (type) {
    case "magazine":
      return <SvgMaskIcon src="/icon/magazine.svg" {...props} />;
    case "place":
      return <SvgMaskIcon src="/icon/lieu.svg" {...props} />;
    case "person":
      return <SvgMaskIcon src="/icon/acteurs.svg" {...props} />;
    case "event":
      return <SvgMaskIcon src="/icon/event.svg" {...props} />;
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
    return <SvgMaskIcon src="/icon/pause.svg" {...props} />;
  }

  switch (kind) {
    case "video":
      return <SvgMaskIcon src="/icon/play.svg" {...props} />;
    case "audio":
      return <SvgMaskIcon src="/icon/headphones.svg" {...props} />;
    case "image":
    case "read":
      return <SvgMaskIcon src="/icon/read.svg" {...props} />;
  }
}

export function ShareIcon(props: IconProps) {
  return <SvgMaskIcon src="/icon/share.svg" {...props} />;
}

export function CloudIcon(props: IconProps) {
  return <SvgMaskIcon src="/icon/cloud.svg" {...props} />;
}

export function FilterIcon(props: IconProps) {
  return <SvgMaskIcon src="/icon/filter.svg" {...props} />;
}
