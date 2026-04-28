const RECENT_VIEWED_STORAGE_KEY = "lela_recently_viewed_editorials";
const RECENT_VIEWED_LIMIT = 24;

export function readRecentViewedEditorialIds(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(RECENT_VIEWED_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((entry): entry is string => typeof entry === "string");
  } catch {
    return [];
  }
}

export function writeRecentViewedEditorialId(editorialId: string) {
  if (typeof window === "undefined") {
    return;
  }

  const current = readRecentViewedEditorialIds();
  const next = [editorialId, ...current.filter((entry) => entry !== editorialId)].slice(
    0,
    RECENT_VIEWED_LIMIT
  );
  window.localStorage.setItem(RECENT_VIEWED_STORAGE_KEY, JSON.stringify(next));
}
