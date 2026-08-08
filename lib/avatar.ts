// Deterministic memoji assignment — same seed always resolves to the same
// file so a given user's avatar stays stable across renders/sessions.
export const MEMOJI_COUNT = 58;

export const MEMOJI_INDICES: number[] = Array.from({ length: MEMOJI_COUNT }, (_, i) => i + 1);

export function hashToIndex(seed: number | string): number {
  let hash: number;
  if (typeof seed === "number") {
    hash = seed;
  } else {
    hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.charCodeAt(i)) | 0;
    }
  }
  return (Math.abs(hash) % MEMOJI_COUNT) + 1;
}

export function memojiSrc(seed: number | string): string {
  return `/memoji/${hashToIndex(seed)}.png`;
}

export function initials(name: string): string {
  return name
    .replace(/^(Dr\.|Prof\.)\s+/i, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
