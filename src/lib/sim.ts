// Simplified fleet model for the "before / after" map. Both runs use the same trucks and
// the same freight market. The only difference is how the next load is found:
// - manual: the dispatcher sees part of the offers near the truck (a few calls, one exchange)
// - cursus: every offer within reach is ranked by margin per kilometre
// Driving uses an average speed that already includes breaks, rests and traffic,
// so trucks move continuously on the map. This is an illustration, not a forecast.
import { CITIES, CITY, type CityId, haversineKm, makeTrack, roadKm, tripPolyline, type Track } from './network';
import { COST_PER_KM } from './ranking';
import { rng } from './rng';

export const SIM_HOURS = 72;
const H = SIM_HOURS * 60;
const AVG_KMH = 45;
const travel = (km: number) => Math.round((km / AVG_KMH) * 60);

export type Policy = 'manual' | 'cursus';

interface PoolLoad {
  id: string;
  from: CityId;
  to: CityId;
  km: number;
  rate: number;
  appear: number;
  pickupUntil: number;
}

export interface SimLeg {
  kind: 'empty' | 'loaded' | 'wait';
  t0: number;
  t1: number;
  km: number;
  from: CityId;
  to: CityId;
  track: Track | null;
  /** Freight rate, paid when a loaded leg ends. */
  rate: number;
}

export interface SimTruck {
  id: number;
  start: CityId;
  legs: SimLeg[];
}

export interface SimTotals {
  emptyKm: number;
  loadedKm: number;
  delivered: number;
  revenue: number;
  margin: number;
  emptyShare: number;
}

export interface SimRun {
  policy: Policy;
  trucks: SimTruck[];
  totalsAt: (t: number) => SimTotals;
  final: SimTotals;
}

const START_CITIES: CityId[] = [
  'lyon', 'munich', 'vienna', 'milan', 'hamburg', 'rotterdam', 'paris', 'zurich', 'prague',
  'warsaw', 'barcelona', 'frankfurt', 'duisburg', 'linz', 'basel', 'stuttgart', 'brussels', 'berlin',
];

const trackCache = new Map<string, Track>();
function legTrack(from: CityId, to: CityId): Track {
  const key = `${from}>${to}`;
  let t = trackCache.get(key);
  if (!t) {
    t = makeTrack(tripPolyline([from, to]));
    trackCache.set(key, t);
  }
  return t;
}

function makePool(): PoolLoad[] {
  const r = rng('cursus-fleet-v1');
  const pool: PoolLoad[] = [];
  for (const c of CITIES) {
    const n = c.hub === 3 ? 22 : c.hub === 2 ? 9 : 2;
    for (let i = 0; i < n; i++) {
      const dests = CITIES.filter((d) => {
        if (d.id === c.id) return false;
        const km = roadKm(c.id, d.id);
        return km > 200 && km < 1100;
      });
      if (!dests.length) continue;
      const to = r.weighted(dests, (d) => 1 + d.hub).id;
      const km = roadKm(c.id, to);
      const cheap = r.next() < 0.22;
      const rate = Math.round(km * (cheap ? r.range(1.3, 1.6) : r.range(1.72, 2.4)) + 80);
      const appear = Math.round(r.range(0, H - 480));
      pool.push({ id: `${c.id}-${i}`, from: c.id, to, km, rate, appear, pickupUntil: appear + Math.round(r.range(240, 600)) });
    }
  }
  return pool;
}

function score(load: PoolLoad, emptyKm: number) {
  return (load.rate - COST_PER_KM * (load.km + emptyKm)) / (load.km + emptyKm);
}

const HUBS = CITIES.filter((c) => c.hub === 3).map((c) => c.id);

function nearestHub(from: CityId): CityId {
  let best = HUBS[0];
  for (const h of HUBS) if (roadKm(from, h) < roadKm(from, best)) best = h;
  return best;
}

/** The hub with the most open offers in the next hours, discounted by the empty run to get there. */
function bestHub(pool: PoolLoad[], taken: Set<string>, from: CityId, t: number): CityId {
  let best = nearestHub(from);
  let bestVal = -Infinity;
  for (const h of HUBS) {
    const arrive = t + travel(roadKm(from, h));
    const open = pool.filter((l) => !taken.has(l.id) && haversineKm(l.from, h) < 200 && l.appear < arrive + 240 && l.pickupUntil > arrive).length;
    const val = open - roadKm(from, h) / 40;
    if (val > bestVal) {
      bestVal = val;
      best = h;
    }
  }
  return best;
}

export function runSim(policy: Policy): SimRun {
  const pool = makePool();
  const taken = new Set<string>();
  const r = rng(`cursus-fleet-trucks-${policy}`);
  const startR = rng('cursus-fleet-start');
  const trucks: SimTruck[] = START_CITIES.map((start, id) => ({ id, start, legs: [] }));
  const state = trucks.map((tr) => ({ city: tr.start, t: Math.round(startR.range(0, 180)), waits: 0 }));

  for (;;) {
    let idx = -1;
    for (let i = 0; i < state.length; i++) {
      if (state[i].t < H - 60 && (idx < 0 || state[i].t < state[idx].t)) idx = i;
    }
    if (idx < 0) break;
    const s = state[idx];
    const tr = trucks[idx];
    const radius = policy === 'cursus' ? 260 : 160;
    const candidates = pool.filter((l) => {
      if (taken.has(l.id) || l.appear > s.t) return false;
      if (haversineKm(s.city, l.from) > radius) return false;
      return l.pickupUntil >= s.t + travel(roadKm(s.city, l.from));
    });
    // Without Cursus the dispatcher only reaches part of the market before deciding,
    // and judges offers mostly by their rate, not by where the truck ends up.
    const seen = policy === 'cursus' ? candidates : candidates.filter(() => r.next() < 0.45);
    let best: PoolLoad | null = null;
    let bestScore = -Infinity;
    for (const l of seen) {
      const empty = roadKm(s.city, l.from);
      const sc =
        policy === 'cursus'
          ? score(l, empty) + 0.06 * (CITY[l.to].hub - 2)
          : l.rate / l.km - 0.002 * empty;
      if (sc > bestScore) {
        bestScore = sc;
        best = l;
      }
    }
    if (!best) {
      if (s.waits >= 2) {
        // Nothing within reach: drive empty to a busier place.
        const target = policy === 'cursus' ? bestHub(pool, taken, s.city, s.t) : nearestHub(s.city);
        if (target && target !== s.city) {
          const km = roadKm(s.city, target);
          tr.legs.push({ kind: 'empty', t0: s.t, t1: s.t + travel(km), km, from: s.city, to: target, track: legTrack(s.city, target), rate: 0 });
          s.t += travel(km);
          s.city = target;
          s.waits = 0;
          continue;
        }
      }
      const wait = 60;
      tr.legs.push({ kind: 'wait', t0: s.t, t1: s.t + wait, km: 0, from: s.city, to: s.city, track: null, rate: 0 });
      s.t += wait;
      s.waits++;
      continue;
    }
    taken.add(best.id);
    s.waits = 0;
    const emptyKm = roadKm(s.city, best.from);
    if (emptyKm > 0) {
      tr.legs.push({ kind: 'empty', t0: s.t, t1: s.t + travel(emptyKm), km: emptyKm, from: s.city, to: best.from, track: legTrack(s.city, best.from), rate: 0 });
      s.t += travel(emptyKm);
    }
    s.t += 45;
    tr.legs.push({ kind: 'loaded', t0: s.t, t1: s.t + travel(best.km), km: best.km, from: best.from, to: best.to, track: legTrack(best.from, best.to), rate: best.rate });
    s.t += travel(best.km) + 45;
    s.city = best.to;
  }

  const totalsAt = (t: number): SimTotals => {
    let emptyKm = 0;
    let loadedKm = 0;
    let delivered = 0;
    let revenue = 0;
    for (const tr of trucks) {
      for (const leg of tr.legs) {
        if (leg.t0 >= t || leg.kind === 'wait') continue;
        const f = Math.min(1, (t - leg.t0) / (leg.t1 - leg.t0 || 1));
        if (leg.kind === 'empty') emptyKm += leg.km * f;
        else {
          loadedKm += leg.km * f;
          // Freight is earned along the way so trips still running at the end count fairly.
          revenue += leg.rate * f;
          if (f >= 1) delivered++;
        }
      }
    }
    const total = emptyKm + loadedKm;
    return {
      emptyKm,
      loadedKm,
      delivered,
      revenue,
      margin: revenue - COST_PER_KM * total,
      emptyShare: total ? emptyKm / total : 0,
    };
  };
  return { policy, trucks, totalsAt, final: totalsAt(H) };
}
