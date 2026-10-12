import { useState } from 'react';
import { useI18n } from '../i18n';
import { eur, num } from '../lib/format';
import { FULL_TRAILER_LDM, MAX_PAYLOAD_T, type ClientKey, type Goods } from '../lib/loads';
import { cityName, roadKm, type CityId } from '../lib/network';
import { Icon } from './Icon';

interface PartLoad {
  id: string;
  from: CityId;
  to: CityId;
  client: ClientKey;
  goods: Goods;
  ldm: number;
  tons: number;
  rate: number;
}

const LOADS: PartLoad[] = [
  { id: 'A', from: 'lyon', to: 'basel', client: 'chemicals', goods: 'adr', ldm: 4.8, tons: 5.2, rate: 690 },
  { id: 'B', from: 'lyon', to: 'zurich', client: 'machinery', goods: 'general', ldm: 7.2, tons: 8.4, rate: 680 },
  { id: 'C', from: 'villefranche', to: 'basel', client: 'food', goods: 'food', ldm: 6.4, tons: 16, rate: 470 },
  { id: 'D', from: 'lyon', to: 'bern', client: 'beverages', goods: 'general', ldm: 3.2, tons: 9.5, rate: 420 },
];

function plan(sel: PartLoad[]) {
  const start: CityId = 'lyon';
  const pickups = [...new Set(sel.map((l) => l.from))].sort((a, b) => roadKm(start, a) - roadKm(start, b));
  const drops = [...new Set(sel.map((l) => l.to))].sort((a, b) => roadKm(start, a) - roadKm(start, b));
  const stops = [...pickups, ...drops];
  let km = 0;
  for (let i = 0; i < stops.length - 1; i++) km += roadKm(stops[i], stops[i + 1]);
  return { stops, km };
}

export function PartLoads() {
  const { d, t, lang } = useI18n();
  const [ids, setIds] = useState<string[]>(['A', 'B']);
  const sel = LOADS.filter((l) => ids.includes(l.id));
  const ldm = sel.reduce((s, l) => s + l.ldm, 0);
  const tons = sel.reduce((s, l) => s + l.tons, 0);
  const goods = new Set(sel.map((l) => l.goods));
  const compatOk = !(goods.has('food') && goods.has('adr'));
  const ldmOk = ldm <= FULL_TRAILER_LDM + 1e-9;
  const weightOk = tons <= MAX_PAYLOAD_T + 1e-9;
  const route = plan(sel);
  const allOk = sel.length > 0 && compatOk && ldmOk && weightOk;
  const rate = sel.reduce((s, l) => s + l.rate, 0);

  const toggle = (id: string) => setIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  let offset = 0;
  return (
    <section className="section section-paper" id="teilladungen">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">{d.part.eyebrow}</p>
          <h2>{d.part.title}</h2>
          <p className="section-lead">{d.part.lead}</p>
        </div>
        <div className="part-grid">
          <ul className="part-list">
            {LOADS.map((l) => {
              const on = ids.includes(l.id);
              return (
                <li key={l.id}>
                  <button type="button" className={`part-item goods-${l.goods} ${on ? 'is-on' : ''}`} aria-pressed={on} onClick={() => toggle(l.id)}>
                    <span className="part-check" aria-hidden="true">{on && <Icon name="check" size={14} />}</span>
                    <span className="part-main">
                      <span className="part-route">
                        {cityName(l.from, lang)} → {cityName(l.to, lang)}
                      </span>
                      <span className="part-meta">
                        {d.data.clients[l.client]} · <span className={`goods-tag goods-${l.goods}`}>{d.part.goods[l.goods]}</span>
                      </span>
                    </span>
                    <span className="part-size tabular">
                      {num(lang, l.ldm, 1)} ldm
                      <small>{num(lang, l.tons, 1)} t</small>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="trailer-card">
            <p className="trailer-label">{d.part.trailer}</p>
            <div className="trailer" role="img" aria-label={t(d.part.checks.ldm, { v: num(lang, ldm, 1) })}>
              <div className={`trailer-deck ${ldmOk ? '' : 'is-over'}`}>
                {sel.map((l) => {
                  const left = (offset / FULL_TRAILER_LDM) * 100;
                  offset += l.ldm;
                  return (
                    <span key={l.id} className={`cargo goods-${l.goods}`} style={{ left: `${left}%`, width: `${(l.ldm / FULL_TRAILER_LDM) * 100}%` }}>
                      <span>{num(lang, l.ldm, 1)}</span>
                    </span>
                  );
                })}
                {FULL_TRAILER_LDM - ldm >= 2.6 && sel.length > 0 && (
                  <span className="deck-free" style={{ left: `${(ldm / FULL_TRAILER_LDM) * 100}%` }}>
                    {t(d.part.free, { ldm: num(lang, FULL_TRAILER_LDM - ldm, 1) })}
                  </span>
                )}
              </div>
              <div className="trailer-scale" aria-hidden="true">
                {[0, 2, 4, 6, 8, 10, 12, 13.6].map((m) => (
                  <span key={m} style={{ left: `${(m / FULL_TRAILER_LDM) * 100}%` }}>{num(lang, m, m % 1 ? 1 : 0)}</span>
                ))}
              </div>
              <div className="trailer-wheels" aria-hidden="true">
                <i /><i /><i />
              </div>
            </div>
            {sel.length === 0 ? (
              <p className="part-verdict">{d.part.empty}</p>
            ) : (
              <>
                <ul className="checks">
                  <li className={ldmOk ? 'ok' : 'fail'}>
                    <Icon name={ldmOk ? 'check' : 'x'} size={16} /> {t(d.part.checks.ldm, { v: num(lang, ldm, 1) })}
                  </li>
                  <li className={weightOk ? 'ok' : 'fail'}>
                    <Icon name={weightOk ? 'check' : 'x'} size={16} /> {t(d.part.checks.weight, { v: num(lang, tons, 1) })}
                  </li>
                  <li className={compatOk ? 'ok' : 'fail'}>
                    <Icon name={compatOk ? 'check' : 'x'} size={16} /> {compatOk ? d.part.checks.compat : d.part.checks.compatFail}
                  </li>
                  <li className={allOk ? 'ok' : 'na'}>
                    <Icon name={allOk ? 'check' : 'x'} size={16} /> {d.part.checks.route}
                  </li>
                </ul>
                <p className={`part-verdict ${allOk ? 'is-ok' : 'is-fail'}`}>
                  {allOk
                    ? t(d.part.ok, { n: route.stops.length, km: num(lang, route.km), rate: eur(lang, rate) })
                    : d.part.fail}
                </p>
                {allOk && <p className="part-route-line">{route.stops.map((c) => cityName(c, lang)).join(' → ')}</p>}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
