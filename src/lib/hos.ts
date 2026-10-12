// Driving and rest times, simplified from EU Regulation 561/2006:
// at most 4.5 h of driving before a 45 min break, at most 9 h of driving per day,
// then an 11 h daily rest. Times are minutes from today 00:00.

export const SPEED_KMH = 68;
export const MAX_BLOCK = 270;
export const BREAK = 45;
export const MAX_DAY = 540;
export const DAILY_REST = 660;

export interface HosState {
  /** Driving minutes left before the daily rest. */
  leftToday: number;
  /** Driving minutes since the last 45 min break. */
  sinceBreak: number;
}

export interface DriveResult {
  end: number;
  state: HosState;
  rests: number;
  breaks: number;
}

export const driveMinutes = (km: number) => Math.round((km / SPEED_KMH) * 60);

/** Drive for `minutes` starting at `start`, inserting breaks and daily rests as the rules require. */
export function drive(start: number, minutes: number, state: HosState): DriveResult {
  let t = start;
  let left = minutes;
  let { leftToday, sinceBreak } = state;
  let rests = 0;
  let breaks = 0;
  while (left > 0) {
    if (leftToday <= 0) {
      t += DAILY_REST;
      leftToday = MAX_DAY;
      sinceBreak = 0;
      rests++;
      continue;
    }
    if (sinceBreak >= MAX_BLOCK) {
      t += BREAK;
      sinceBreak = 0;
      breaks++;
      continue;
    }
    const chunk = Math.min(left, leftToday, MAX_BLOCK - sinceBreak);
    t += chunk;
    left -= chunk;
    leftToday -= chunk;
    sinceBreak += chunk;
  }
  return { end: t, state: { leftToday, sinceBreak }, rests, breaks };
}
