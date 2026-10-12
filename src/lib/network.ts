import citiesJson from '../data/cities.json';
import { CITY_XY } from '../data/map.generated';

export type CityId = string;

export interface City {
  id: CityId;
  de: string;
  en: string;
  cc: string;
  lat: number;
  lon: number;
  hub: 1 | 2 | 3;
}

export const CITIES: City[] = citiesJson as City[];
export const CITY: Record<CityId, City> = Object.fromEntries(CITIES.map((c) => [c.id, c]));

/** Average road kilometres per straight-line kilometre on European motorway corridors. */
const ROAD_FACTOR = 1.2;

/** Motorway corridors between the cities on the map. Distances come from the coordinates. */
const EDGES: [CityId, CityId][] = [
  ['madrid', 'barcelona'], ['madrid', 'bordeaux'], ['barcelona', 'marseille'], ['bordeaux', 'paris'],
  ['marseille', 'lyon'], ['lyon', 'villefranche'], ['villefranche', 'paris'], ['lyon', 'grenoble'],
  ['lyon', 'geneva'], ['grenoble', 'turin'], ['lyon', 'besancon'], ['besancon', 'basel'],
  ['besancon', 'paris'], ['geneva', 'bern'], ['bern', 'zurich'], ['bern', 'basel'], ['basel', 'zurich'],
  ['basel', 'strasbourg'], ['strasbourg', 'paris'], ['strasbourg', 'stuttgart'], ['strasbourg', 'frankfurt'],
  ['zurich', 'milan'], ['zurich', 'munich'], ['zurich', 'stuttgart'], ['turin', 'milan'], ['milan', 'verona'],
  ['verona', 'bologna'], ['verona', 'innsbruck'], ['innsbruck', 'munich'], ['munich', 'salzburg'],
  ['salzburg', 'linz'], ['linz', 'vienna'], ['salzburg', 'graz'], ['vienna', 'graz'], ['graz', 'ljubljana'],
  ['ljubljana', 'verona'], ['vienna', 'bratislava'], ['bratislava', 'budapest'], ['vienna', 'brno'],
  ['brno', 'prague'], ['prague', 'dresden'], ['dresden', 'leipzig'], ['dresden', 'wroclaw'],
  ['wroclaw', 'warsaw'], ['wroclaw', 'poznan'], ['poznan', 'berlin'], ['poznan', 'warsaw'],
  ['berlin', 'leipzig'], ['berlin', 'hamburg'], ['berlin', 'hanover'], ['leipzig', 'nuremberg'],
  ['nuremberg', 'munich'], ['nuremberg', 'frankfurt'], ['nuremberg', 'prague'], ['munich', 'stuttgart'],
  ['stuttgart', 'frankfurt'], ['frankfurt', 'cologne'], ['cologne', 'duisburg'], ['cologne', 'brussels'],
  ['duisburg', 'rotterdam'], ['rotterdam', 'amsterdam'], ['rotterdam', 'antwerp'], ['antwerp', 'brussels'],
  ['brussels', 'lille'], ['lille', 'paris'], ['lille', 'calais'], ['calais', 'london'],
  ['london', 'birmingham'], ['duisburg', 'hanover'], ['hanover', 'hamburg'], ['hamburg', 'bremen'],
  ['bremen', 'duisburg'], ['frankfurt', 'hanover'], ['hamburg', 'copenhagen'], ['copenhagen', 'gothenburg'],
  ['linz', 'prague'], ['budapest', 'graz'], ['linz', 'nuremberg'],
];

export function haversineKm(a: CityId, b: CityId): number {
  const A = CITY[a];
  const B = CITY[b];
  const R = 6371;
  const dLat = ((B.lat - A.lat) * Math.PI) / 180;
  const dLon = ((B.lon - A.lon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((A.lat * Math.PI) / 180) * Math.cos((B.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

const ADJ: Record<CityId, { to: CityId; km: number }[]> = {};
for (const c of CITIES) ADJ[c.id] = [];
for (const [a, b] of EDGES) {
  const km = haversineKm(a, b) * ROAD_FACTOR;
  // The Channel crossing is slower than its distance suggests.
  const cost = (a === 'calais' && b === 'london') || (a === 'london' && b === 'calais') ? km + 60 : km;
  ADJ[a].push({ to: b, km: cost });
  ADJ[b].push({ to: a, km: cost });
}

export interface Route {
  stops: CityId[];
  km: number;
}

const routeCache = new Map<string, Route>();

/** Shortest road route between two cities (Dijkstra over the corridor graph). */
export function route(from: CityId, to: CityId): Route {
  if (from === to) return { stops: [from], km: 0 };
  const key = `${from}>${to}`;
  const hit = routeCache.get(key);
  if (hit) return hit;
  const dist: Record<CityId, number> = {};
  const prev: Record<CityId, CityId | undefined> = {};
  const open = new Set<CityId>(CITIES.map((c) => c.id));
  for (const c of CITIES) dist[c.id] = Infinity;
  dist[from] = 0;
  while (open.size) {
    let u: CityId | null = null;
    for (const id of open) if (u === null || dist[id] < dist[u]) u = id;
    if (u === null || dist[u] === Infinity) break;
    open.delete(u);
    if (u === to) break;
    for (const e of ADJ[u]) {
      const alt = dist[u] + e.km;
      if (alt < dist[e.to]) {
        dist[e.to] = alt;
        prev[e.to] = u;
      }
    }
  }
  const stops: CityId[] = [];
  let cur: CityId | undefined = to;
  while (cur) {
    stops.unshift(cur);
    cur = prev[cur];
  }
  const r = { stops, km: Math.round(dist[to]) };
  routeCache.set(key, r);
  routeCache.set(`${to}>${from}`, { stops: [...stops].reverse(), km: r.km });
  return r;
}

export const roadKm = (a: CityId, b: CityId) => route(a, b).km;

export function cityXY(id: CityId): [number, number] {
  return CITY_XY[id];
}

/** Polyline in map coordinates through every city of a multi-stop trip. */
export function tripPolyline(stops: CityId[]): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i < stops.length - 1; i++) {
    const r = route(stops[i], stops[i + 1]);
    const seg = r.stops.map(cityXY);
    if (pts.length) seg.shift();
    pts.push(...seg);
  }
  if (!pts.length && stops.length) pts.push(cityXY(stops[0]));
  return pts;
}

/** Smooth SVG path through points (Catmull-Rom converted to cubic Béziers). */
export function smoothPath(pts: [number, number][]): string {
  if (pts.length < 2) return '';
  if (pts.length === 2) return `M${pts[0][0]},${pts[0][1]}L${pts[1][0]},${pts[1][1]}`;
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0]},${p2[1]}`;
  }
  return d;
}

/** Dense points on a Catmull-Rom curve through pts, so drawing and animation share one line. */
export function smoothPoints(pts: [number, number][], steps = 8): [number, number][] {
  if (pts.length < 3) return pts;
  const out: [number, number][] = [pts[0]];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([
        Math.round(f(p0[0], p1[0], p2[0], p3[0]) * 10) / 10,
        Math.round(f(p0[1], p1[1], p2[1], p3[1]) * 10) / 10,
      ]);
    }
  }
  return out;
}

export function polyPath(pts: [number, number][]): string {
  return pts.length ? 'M' + pts.map((p) => `${p[0]},${p[1]}`).join('L') : '';
}

/** Point at fraction t (0..1) along a polyline, measured by length. */
export function pointAlong(pts: [number, number][], t: number): [number, number] {
  if (pts.length === 1) return pts[0];
  const lens: number[] = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    lens.push(l);
    total += l;
  }
  let target = Math.max(0, Math.min(1, t)) * total;
  for (let i = 0; i < lens.length; i++) {
    if (target <= lens[i] || i === lens.length - 1) {
      const f = lens[i] ? target / lens[i] : 0;
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f];
    }
    target -= lens[i];
  }
  return pts[pts.length - 1];
}

export interface Track {
  pts: [number, number][];
  d: string;
  total: number;
  at: (t: number) => [number, number];
  /** Path of the first fraction t of the track, for drawing a trail. */
  upTo: (t: number) => string;
  /** Path between fractions a and b. */
  slice: (a: number, b: number) => string;
}

/** Precomputed polyline for animation: position lookups without re-measuring each frame. */
export function makeTrack(raw: [number, number][]): Track {
  const pts = smoothPoints(raw);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  const total = cum[cum.length - 1] || 0;
  const locate = (t: number) => {
    const target = Math.max(0, Math.min(1, t)) * total;
    let lo = 0;
    let hi = cum.length - 1;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] <= target) lo = mid;
      else hi = mid;
    }
    const seg = cum[hi] - cum[lo] || 1;
    const f = (target - cum[lo]) / seg;
    const p: [number, number] = [
      pts[lo][0] + ((pts[hi]?.[0] ?? pts[lo][0]) - pts[lo][0]) * f,
      pts[lo][1] + ((pts[hi]?.[1] ?? pts[lo][1]) - pts[lo][1]) * f,
    ];
    return { i: lo, p };
  };
  return {
    pts,
    d: polyPath(pts),
    total,
    at: (t) => (pts.length === 1 ? pts[0] : locate(t).p),
    upTo: (t) => {
      if (pts.length < 2 || t <= 0) return '';
      const { i, p } = locate(t);
      return polyPath([...pts.slice(0, i + 1), p]);
    },
    slice: (a, b) => {
      if (pts.length < 2 || b <= a) return '';
      const s0 = locate(a);
      const s1 = locate(b);
      return polyPath([s0.p, ...pts.slice(s0.i + 1, s1.i + 1), s1.p]);
    },
  };
}

export function cityName(id: CityId, lang: 'de' | 'en'): string {
  return CITY[id]?.[lang] ?? id;
}
