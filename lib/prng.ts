// Deterministic seeded PRNG (mulberry32) — never Math.random() in shared
// logic, so "same seed -> same output" holds everywhere it's used (the
// allocation engine, the research simulator). Pure function, safe to call
// during render (won't trip the React Compiler's react-hooks/purity rule).
export function mulberry32(seed: number): () => number {
  let a = seed;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Derives an independent deterministic sub-seed from a base seed + a salt
// (e.g. a waitlist entry id or event index) via a cheap string hash, so
// every candidate/event can draw its own reproducible random value without
// depending on a shared PRNG's sequence position (call order).
export function seededHash(seed: number, salt: string | number): number {
  let h = seed | 0;
  const str = String(salt);
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(h, 31) + str.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}
