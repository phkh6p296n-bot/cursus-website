export type Lang = 'de' | 'en';

const locale = (lang: Lang) => (lang === 'de' ? 'de-DE' : 'en-GB');

export function eur(lang: Lang, v: number) {
  return new Intl.NumberFormat(locale(lang), { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Math.round(v));
}

export function eurPrecise(lang: Lang, v: number) {
  return new Intl.NumberFormat(locale(lang), { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
}

export function num(lang: Lang, v: number, digits = 0) {
  return new Intl.NumberFormat(locale(lang), { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v);
}

export function pct(lang: Lang, v: number, digits = 1) {
  return new Intl.NumberFormat(locale(lang), { style: 'percent', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v);
}

export const clock = (m: number) => {
  const mm = ((Math.round(m) % 1440) + 1440) % 1440;
  return `${String(Math.floor(mm / 60)).padStart(2, '0')}:${String(mm % 60).padStart(2, '0')}`;
};

/** "heute 15:00", "morgen ~14:00", "Mittwoch 08:00", relative to today 00:00 in the visitor's calendar. */
export function when(lang: Lang, m: number, approx = false) {
  const day = Math.floor(m / 1440);
  const t = (approx ? '~' : '') + clock(approx ? Math.round(m / 15) * 15 : m);
  if (day === 0) return lang === 'de' ? `heute ${t}` : `today ${t}`;
  if (day === 1) return lang === 'de' ? `morgen ${t}` : `tomorrow ${t}`;
  const date = new Date();
  date.setDate(date.getDate() + day);
  const weekday = new Intl.DateTimeFormat(lang === 'de' ? 'de-DE' : 'en-GB', { weekday: 'long' }).format(date);
  return `${weekday} ${t}`;
}

export function duration(lang: Lang, minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (!h) return `${m} min`;
  if (!m) return `${h} h`;
  return lang === 'de' ? `${h} h ${m} min` : `${h} h ${m} min`;
}
