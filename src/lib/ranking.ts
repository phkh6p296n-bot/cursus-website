import { drive, driveMinutes, type HosState } from './hos';
import { FULL_TRAILER_LDM, MAX_PAYLOAD_T, hubOf, isFtl, loadKm, type Load, type Truck } from './loads';
import { roadKm, type CityId } from './network';

/** Cost assumption from the pitch deck: EUR per kilometre driven, empty or loaded. */
export const COST_PER_KM = 1.5;
const LOAD_MIN = 60;
const STOP_MIN = 45;

export type RejectReason = 'reefer' | 'pickup_window' | 'delivery_window' | 'compat' | 'below_cost' | 'overload';

export interface Option {
  id: string;
  loads: Load[];
  /** Truck position first, then every pickup and delivery in order. */
  stops: CityId[];
  emptyKm: number;
  loadedKm: number;
  rate: number;
  margin: number;
  marginPerKm: number;
  ldm: number;
  tons: number;
  pickupEta: number;
  deliveryEta: number;
  driveMin: number;
  rests: number;
  followUp: 'good' | 'ok' | 'weak';
  rejected?: RejectReason;
  /** For rejections with a time: the moment that does not work and the limit it misses. */
  missed?: { at: number; limit: number };
}

export type SortMode = 'perKm' | 'total' | 'empty';

export interface RankResult {
  options: Option[];
  rejected: Option[];
  offers: number;
  combos: number;
}

const followUp = (to: CityId): Option['followUp'] => (hubOf(to) >= 3 ? 'good' : hubOf(to) === 2 ? 'ok' : 'weak');

function finish(o: Omit<Option, 'margin' | 'marginPerKm'>): Option {
  const totalKm = o.emptyKm + o.loadedKm;
  const margin = Math.round(o.rate - COST_PER_KM * totalKm);
  return { ...o, margin, marginPerKm: totalKm ? margin / totalKm : 0 };
}

export function evaluateSingle(truck: Truck, l: Load): Option {
  const emptyKm = roadKm(truck.city, l.from) + (l.extraEmptyKm ?? 0);
  const loadedKm = loadKm(l);
  const start: HosState = { leftToday: truck.driveLeftMin, sinceBreak: 0 };
  const toPickup = drive(truck.freeAt, driveMinutes(emptyKm), start);
  const loadStart = Math.max(toPickup.end, l.pickupFrom);
  const toDelivery = drive(loadStart + LOAD_MIN, driveMinutes(loadedKm), toPickup.state);
  let rejected: RejectReason | undefined;
  let missed: Option['missed'];
  if (l.goods === 'reefer' && truck.trailer !== 'reefer') rejected = 'reefer';
  else if (toPickup.end > l.pickupUntil) {
    rejected = 'pickup_window';
    missed = { at: toPickup.end, limit: l.pickupUntil };
  } else if (toDelivery.end > l.deliverBy) {
    rejected = 'delivery_window';
    missed = { at: toDelivery.end, limit: l.deliverBy };
  }
  const o = finish({
    id: l.id,
    loads: [l],
    stops: [truck.city, l.from, l.to],
    emptyKm,
    loadedKm,
    rate: l.rate,
    ldm: l.ldm,
    tons: l.tons,
    pickupEta: loadStart,
    deliveryEta: toDelivery.end,
    driveMin: driveMinutes(emptyKm + loadedKm),
    rests: toPickup.rests + toDelivery.rests,
    followUp: followUp(l.to),
    rejected,
    missed,
  });
  if (!o.rejected && o.margin < 0) o.rejected = 'below_cost';
  return o;
}

const incompatible = (a: Load, b: Load) =>
  (a.goods === 'food' && b.goods === 'adr') || (a.goods === 'adr' && b.goods === 'food');

/** Two part loads in one trailer: space, weight, goods and every time window must fit. */
export function evaluateCombo(truck: Truck, a: Load, b: Load): Option | null {
  if (isFtl(a) || isFtl(b) || a.goods === 'reefer' || b.goods === 'reefer') return null;
  if (roadKm(a.from, b.from) > 70) return null;
  const ldm = Math.round((a.ldm + b.ldm) * 10) / 10;
  const tons = Math.round((a.tons + b.tons) * 10) / 10;
  if (ldm > FULL_TRAILER_LDM) return null;

  const [p1, p2] = roadKm(truck.city, a.from) <= roadKm(truck.city, b.from) ? [a, b] : [b, a];
  const orderA = roadKm(p2.from, p1.to) + roadKm(p1.to, p2.to);
  const orderB = roadKm(p2.from, p2.to) + roadKm(p2.to, p1.to);
  const [d1, d2] = orderA <= orderB ? [p1, p2] : [p2, p1];
  const loadedKm = roadKm(p1.from, p2.from) + (p2.extraEmptyKm ?? 0) + Math.min(orderA, orderB);
  const direct = Math.max(loadKm(a), loadKm(b));
  if (loadedKm > direct * 1.35) return null;

  const emptyKm = roadKm(truck.city, p1.from) + (p1.extraEmptyKm ?? 0);
  let state: HosState = { leftToday: truck.driveLeftMin, sinceBreak: 0 };
  let t = truck.freeAt;
  let rests = 0;
  let rejected: RejectReason | undefined;
  let missed: Option['missed'];
  const leg = (km: number) => {
    const r = drive(t, driveMinutes(km), state);
    t = r.end;
    state = r.state;
    rests += r.rests;
  };
  leg(emptyKm);
  if (t > p1.pickupUntil) { rejected = 'pickup_window'; missed = { at: t, limit: p1.pickupUntil }; }
  t = Math.max(t, p1.pickupFrom) + STOP_MIN;
  const pickupEta = t - STOP_MIN;
  leg(roadKm(p1.from, p2.from) + (p2.extraEmptyKm ?? 0));
  if (!rejected && t > p2.pickupUntil) { rejected = 'pickup_window'; missed = { at: t, limit: p2.pickupUntil }; }
  t = Math.max(t, p2.pickupFrom) + STOP_MIN;
  leg(roadKm(p2.from, d1.to));
  if (!rejected && t > d1.deliverBy) { rejected = 'delivery_window'; missed = { at: t, limit: d1.deliverBy }; }
  t += STOP_MIN;
  leg(roadKm(d1.to, d2.to));
  if (!rejected && t > d2.deliverBy) { rejected = 'delivery_window'; missed = { at: t, limit: d2.deliverBy }; }

  if (incompatible(a, b)) rejected = 'compat';
  else if (tons > MAX_PAYLOAD_T) rejected = 'overload';

  const stops: CityId[] = [truck.city, p1.from];
  if (p2.from !== p1.from) stops.push(p2.from);
  stops.push(d1.to);
  if (d2.to !== d1.to) stops.push(d2.to);

  const o = finish({
    id: `${a.id}+${b.id}`,
    loads: [p1, p2],
    stops,
    emptyKm,
    loadedKm,
    rate: a.rate + b.rate,
    ldm,
    tons,
    pickupEta,
    deliveryEta: t,
    driveMin: driveMinutes(emptyKm + loadedKm),
    rests,
    followUp: followUp(d2.to),
    rejected,
    missed,
  });
  if (!o.rejected && o.margin < 0) o.rejected = 'below_cost';
  return o;
}

export function rank(truck: Truck, loads: Load[], sort: SortMode = 'perKm'): RankResult {
  const all: Option[] = loads.map((l) => evaluateSingle(truck, l));
  let combos = 0;
  for (let i = 0; i < loads.length; i++) {
    for (let j = i + 1; j < loads.length; j++) {
      const c = evaluateCombo(truck, loads[i], loads[j]);
      if (c) {
        combos++;
        all.push(c);
      }
    }
  }
  const options = all.filter((o) => !o.rejected);
  const cmp: Record<SortMode, (a: Option, b: Option) => number> = {
    perKm: (a, b) => b.marginPerKm - a.marginPerKm,
    total: (a, b) => b.margin - a.margin,
    empty: (a, b) => a.emptyKm - b.emptyKm || b.marginPerKm - a.marginPerKm,
  };
  options.sort(cmp[sort]);
  // Each load appears in one suggestion only, so the list shows distinct choices.
  const used = new Set<string>();
  const distinct = options.filter((o) => {
    if (o.loads.some((l) => used.has(l.id))) return false;
    o.loads.forEach((l) => used.add(l.id));
    return true;
  });
  // Show each kind of rejection once, compatibility first because it is the least obvious.
  const order: RejectReason[] = ['compat', 'delivery_window', 'pickup_window', 'reefer', 'overload', 'below_cost'];
  const rejected = all
    .filter((o) => o.rejected)
    .sort((a, b) => order.indexOf(a.rejected!) - order.indexOf(b.rejected!));
  return { options: distinct, rejected, offers: loads.length, combos };
}
