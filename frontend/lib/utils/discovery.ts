import type { EditorialCard } from "@/lib/api/types";

const RECENT_VIEWED_STORAGE_KEY = "lela_recently_viewed_editorials";
const RECENT_VIEWED_LIMIT = 24;

function createSeededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleEditorials(items: EditorialCard[], seed: number): EditorialCard[] {
  const output = [...items];
  const random = createSeededRandom(seed);
  for (let index = output.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [output[index], output[swapIndex]] = [output[swapIndex], output[index]];
  }
  return output;
}

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

