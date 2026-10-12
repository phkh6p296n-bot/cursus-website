/** Small seeded random generator so every visitor sees the same example data. */
export function rng(seed: number | string) {
  let h = typeof seed === 'number' ? seed >>> 0 : 2166136261;
  if (typeof seed === 'string') {
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
  }
  let a = h || 1;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range: (min: number, max: number) => min + next() * (max - min),
    int: (min: number, max: number) => Math.floor(min + next() * (max - min + 1)),
    pick: <T,>(arr: T[]): T => arr[Math.floor(next() * arr.length)],
    weighted: <T,>(items: T[], weight: (x: T) => number): T => {
      const total = items.reduce((s, x) => s + weight(x), 0);
      let r = next() * total;
      for (const x of items) {
        r -= weight(x);
        if (r <= 0) return x;
      }
      return items[items.length - 1];
    },
  };
}
