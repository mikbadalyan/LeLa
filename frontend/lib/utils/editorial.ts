export type FeedFocus = "feed" | "place" | "person" | "event" | "chat";

export function resolveFeedFilterFromFocus(
  focus: FeedFocus,
  storedFilter: string
): string {
  if (focus === "place" || focus === "person" || focus === "event") {
    return focus;
  }

  if (focus === "feed") {
    return "all";
  }

  return storedFilter || "all";
}

export function buildEditorialMapHref(
  editorialId: string,
  basePath = ""
): string {
  return `${basePath}/map?editorial=${encodeURIComponent(editorialId)}`;
}

export function shouldRenderEditorialAddress(
  address?: string | null,
  subtitle?: string | null
): boolean {
  if (!address) {
    return false;
  }

  const normalizedAddress = address.trim().toLowerCase();
  const normalizedSubtitle = subtitle?.trim().toLowerCase() ?? "";
  return normalizedAddress !== normalizedSubtitle;
}
