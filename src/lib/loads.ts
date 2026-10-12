import { CITIES, CITY, type CityId, haversineKm, roadKm } from './network';
import { rng } from './rng';
import { drive } from './hos';

export type Goods = 'general' | 'food' | 'adr' | 'reefer';
export type Source = 'timocom' | 'transeu' | 'tms' | 'regular';
export type ClientKey =
  | 'autoparts' | 'food' | 'chemicals' | 'machinery' | 'retail' | 'beverages'
  | 'paper' | 'dairy' | 'steel' | 'electronics' | 'furniture' | 'building';

export const FULL_TRAILER_LDM = 13.6;
export const MAX_PAYLOAD_T = 24;

export interface Load {
  id: string;
  from: CityId;
  to: CityId;
  client: ClientKey;
  source: Source;
  ldm: number;
  tons: number;
  goods: Goods;
  /** Freight rate in EUR for the whole trip. */
  rate: number;
  /** Minutes from today 00:00. */
  pickupFrom: number;
  pickupUntil: number;
  deliverBy: number;
  /** Kilometres from the city centre to the loading ramp. */
  extraEmptyKm?: number;
  /** Fixed loaded distance where the example should match a known figure. */
  kmOverride?: number;
}

export interface Truck {
  id: string;
  label: string;
  city: CityId;
  /** Minutes from today 00:00 when the truck is empty and free. */
  freeAt: number;
  driveLeftMin: number;
  trailer: 'tautliner' | 'reefer';
}

const DAY = 1440;

/** The fixed example from the pitch: truck 14, free in Lyon at 15:00 with 4 h 10 min of driving left. */
export const LYON_TRUCK: Truck = {
  id: 't14',
  label: '14',
  city: 'lyon',
  freeAt: 15 * 60,
  driveLeftMin: 250,
  trailer: 'tautliner',
};

export const LYON_LOADS: Load[] = [
  { id: 'L1', from: 'lyon', to: 'munich', client: 'autoparts', source: 'timocom', ldm: 13.6, tons: 18.5, goods: 'general', rate: 1450, pickupFrom: 900, pickupUntil: 1080, deliverBy: DAY + 1080, extraEmptyKm: 2, kmOverride: 690 },
  { id: 'L2', from: 'villefranche', to: 'milan', client: 'food', source: 'regular', ldm: 8.2, tons: 9.8, goods: 'food', rate: 980, pickupFrom: 900, pickupUntil: 1140, deliverBy: DAY + 720, kmOverride: 470 },
  { id: 'L3', from: 'lyon', to: 'basel', client: 'chemicals', source: 'transeu', ldm: 4.8, tons: 5.2, goods: 'adr', rate: 690, pickupFrom: 900, pickupUntil: 1020, deliverBy: DAY + 600, extraEmptyKm: 0, kmOverride: 410 },
  { id: 'L4', from: 'lyon', to: 'zurich', client: 'machinery', source: 'timocom', ldm: 7.2, tons: 8.4, goods: 'general', rate: 680, pickupFrom: 900, pickupUntil: 1080, deliverBy: DAY + 840, extraEmptyKm: 2 },
  { id: 'L5', from: 'lyon', to: 'hamburg', client: 'retail', source: 'timocom', ldm: 13.6, tons: 14.0, goods: 'general', rate: 2150, pickupFrom: 960, pickupUntil: 1140, deliverBy: 2 * DAY + 480, extraEmptyKm: 6 },
  { id: 'L6', from: 'lyon', to: 'barcelona', client: 'beverages', source: 'transeu', ldm: 13.6, tons: 23.5, goods: 'general', rate: 1080, pickupFrom: 900, pickupUntil: 1140, deliverBy: 2 * DAY, extraEmptyKm: 9 },
  { id: 'L7', from: 'grenoble', to: 'vienna', client: 'paper', source: 'timocom', ldm: 13.6, tons: 22.0, goods: 'general', rate: 1890, pickupFrom: 900, pickupUntil: 960, deliverBy: 2 * DAY + 720 },
  { id: 'L8', from: 'lyon', to: 'paris', client: 'dairy', source: 'tms', ldm: 13.6, tons: 19.0, goods: 'reefer', rate: 980, pickupFrom: 930, pickupUntil: 1080, deliverBy: DAY + 360, extraEmptyKm: 4 },
  { id: 'L9', from: 'lyon', to: 'stuttgart', client: 'electronics', source: 'regular', ldm: 13.6, tons: 11.0, goods: 'general', rate: 1180, pickupFrom: 1020, pickupUntil: 1200, deliverBy: DAY + 480, extraEmptyKm: 3 },
  { id: 'L10', from: 'lyon', to: 'milan', client: 'steel', source: 'transeu', ldm: 13.6, tons: 24.0, goods: 'general', rate: 890, pickupFrom: 900, pickupUntil: 1080, deliverBy: DAY + 1020, extraEmptyKm: 5 },
  { id: 'L11', from: 'villefranche', to: 'basel', client: 'food', source: 'tms', ldm: 6.4, tons: 16.0, goods: 'food', rate: 470, pickupFrom: 900, pickupUntil: 1140, deliverBy: DAY + 900 },
];

const CLIENTS_BY_GOODS: Record<Goods, ClientKey[]> = {
  general: ['autoparts', 'machinery', 'retail', 'beverages', 'paper', 'steel', 'electronics', 'furniture', 'building'],
  food: ['food'],
  adr: ['chemicals'],
  reefer: ['dairy', 'food'],
};

const round30 = (m: number) => Math.round(m / 30) * 30;

/**
 * Example freight offers around a city at a given time. Seeded by city and hour,
 * so the same search always shows the same results.
 */
export function generateLoads(city: CityId, freeAt: number): Load[] {
  if (city === 'lyon' && freeAt === LYON_TRUCK.freeAt) return LYON_LOADS;
  const r = rng(`${city}:${Math.round(freeAt / 60)}`);
  const near = CITIES.filter((c) => c.id !== city && haversineKm(city, c.id) < 170);
  const loads: Load[] = [];
  const partDests: CityId[] = [];
  const count = r.int(15, 19);
  for (let i = 0; i < count; i++) {
    const from = near.length && r.next() < 0.35 ? r.pick(near).id : city;
    const dests = CITIES.filter((c) => {
      if (c.id === from) return false;
      const km = roadKm(from, c.id);
      return km > 160 && km < 1300;
    });
    if (!dests.length) continue;
    const ftl = r.next() < 0.55;
    // Part loads cluster on the same corridors, which is what makes combining them possible.
    const reuse = !ftl && partDests.length && r.next() < 0.55 ? r.pick(partDests) : null;
    const to = reuse && reuse !== from ? reuse : r.weighted(dests, (c) => c.hub * c.hub).id;
    if (!ftl) partDests.push(to);
    const roll = r.next();
    const goods: Goods = roll < 0.62 ? 'general' : roll < 0.8 ? 'food' : roll < 0.91 ? 'adr' : 'reefer';
    const ldm = ftl ? FULL_TRAILER_LDM : Math.round(r.range(2.4, 8.0) / 0.4) * 0.4;
    const tons = ftl ? Math.round(r.range(11, 24) * 10) / 10 : Math.round(ldm * r.range(0.9, 1.5) * 10) / 10;
    const km = roadKm(from, to);
    const rate = ftl
      ? Math.round((km * r.range(1.72, 2.45) + 90) / 10) * 10
      : Math.round((km * (ldm / FULL_TRAILER_LDM) * r.range(2.2, 3.0) + 90) / 10) * 10;
    const pickupFrom = Math.max(round30(freeAt - 60), round30(freeAt + r.range(-60, 150)));
    const pickupUntil = pickupFrom + round30(r.range(60, 240));
    // Delivery deadline: a fresh driver's trip time plus slack; about one in six is too tight.
    const fresh = drive(pickupFrom + 60, Math.round((km / 68) * 60), { leftToday: 540, sinceBreak: 0 }).end;
    const deliverBy = round30(fresh + (r.next() < 0.17 ? r.range(-120, 0) : r.range(240, 900)));
    const srcRoll = r.next();
    const source: Source = srcRoll < 0.4 ? 'timocom' : srcRoll < 0.65 ? 'transeu' : srcRoll < 0.85 ? 'tms' : 'regular';
    loads.push({
      id: `${city}-${i}`,
      from,
      to,
      client: r.pick(CLIENTS_BY_GOODS[goods]),
      source,
      ldm: Math.round(ldm * 10) / 10,
      tons,
      goods,
      rate,
      pickupFrom,
      pickupUntil,
      deliverBy,
      extraEmptyKm: from === city ? r.int(1, 14) : r.int(0, 8),
    });
  }
  return loads;
}

export function loadKm(l: Load): number {
  return l.kmOverride ?? roadKm(l.from, l.to);
}

export const isFtl = (l: Load) => l.ldm >= FULL_TRAILER_LDM;

export function hubOf(id: CityId) {
  return CITY[id]?.hub ?? 1;
}
