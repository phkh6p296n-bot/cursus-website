import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../i18n';
import { useInView } from '../hooks/useInView';
import { useRaf } from '../hooks/useRaf';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { duration, when } from '../lib/format';
import { LYON_TRUCK, generateLoads, type Truck } from '../lib/loads';
import { cityName, makeTrack, tripPolyline, type CityId } from '../lib/network';
import { rank } from '../lib/ranking';
import { EuropeMap } from './EuropeMap';
import { Icon } from './Icon';
import { OptionCard } from './OptionCard';

const HERO_TRUCKS: Truck[] = [
  LYON_TRUCK,
  { id: 't22', label: '22', city: 'vienna', freeAt: 14 * 60, driveLeftMin: 300, trailer: 'tautliner' },
  { id: 't8', label: '8', city: 'rotterdam', freeAt: 10 * 60 + 30, driveLeftMin: 420, trailer: 'tautliner' },
];

const AMBIENT: CityId[][] = [
  ['rotterdam', 'duisburg', 'frankfurt', 'nuremberg', 'munich'],
  ['lyon', 'geneva', 'bern', 'zurich', 'milan'],
  ['hamburg', 'hanover', 'frankfurt', 'stuttgart', 'zurich'],
  ['paris', 'strasbourg', 'stuttgart', 'munich', 'salzburg', 'linz', 'vienna'],
  ['warsaw', 'poznan', 'berlin', 'hamburg'],
  ['barcelona', 'marseille', 'lyon', 'besancon', 'basel'],
  ['prague', 'nuremberg', 'frankfurt', 'cologne', 'brussels'],
  ['milan', 'verona', 'innsbruck', 'munich', 'nuremberg', 'leipzig'],
  ['budapest', 'vienna', 'linz', 'prague', 'dresden'],
  ['london', 'calais', 'lille', 'brussels', 'cologne'],
];

function AmbientMap({ active }: { active: boolean }) {
  const { d } = useI18n();
  const tracks = useMemo(() => AMBIENT.map((stops) => makeTrack(tripPolyline(stops))), []);
  const [t, setT] = useState(0.35);
  useRaf((dt) => setT((v) => v + dt / 26), active);
  return (
    <EuropeMap className="hero-map" label={d.map.title} graticule={false}>
      {({ u }) => (
        <g>
          {tracks.map((tr, i) => {
            const p = (t + i * 0.137) % 1;
            const back = Math.max(0, p - 0.18);
            const [x, y] = tr.at(p);
            return (
              <g key={i}>
                <path d={tr.d} className="ambient-route" vectorEffect="non-scaling-stroke" />
                <path d={tr.slice(back, p)} className="ambient-trail" vectorEffect="non-scaling-stroke" />
                <circle cx={x} cy={y} r={4 * u} className="ambient-truck" />
              </g>
            );
          })}
        </g>
      )}
    </EuropeMap>
  );
}

function DispatchCard({ active }: { active: boolean }) {
  const { d, t, lang } = useI18n();
  const reduced = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [paused, setPaused] = useState(false);
  const truck = HERO_TRUCKS[idx];
  const result = useMemo(() => rank(truck, generateLoads(truck.city, truck.freeAt)), [truck]);

  useEffect(() => {
    if (!active || paused || reduced) return;
    const id = window.setTimeout(() => go((idx + 1) % HERO_TRUCKS.length), 9000);
    return () => window.clearTimeout(id);
  }, [active, paused, reduced, idx]);

  function go(i: number) {
    setScanning(true);
    setIdx(i);
    window.setTimeout(() => setScanning(false), reduced ? 0 : 1300);
  }

  return (
    <div
      className="dispatch-card"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="dispatch-head">
        <span className="plate" aria-hidden="true">{truck.label}</span>
        <div>
          <p className="dispatch-title">
            {t(d.hero.card.truck, { n: truck.label })} · {t(d.hero.card.free, { city: cityName(truck.city, lang), when: when(lang, truck.freeAt) })}
          </p>
          <p className="dispatch-sub">
            {d.hero.card.example} · {t(d.hero.card.left, { time: duration(lang, truck.driveLeftMin) })}
          </p>
        </div>
      </div>
      <div className="dispatch-body" aria-live="polite">
        {scanning ? (
          <div className="scan">
            <span className="scan-bar" />
            <p>{t(d.hero.card.scanning, { n: result.offers })}</p>
          </div>
        ) : (
          <>
            <p className="dispatch-checked">
              <Icon name="check" size={14} /> {t(d.hero.card.checked, { n: result.offers, c: result.combos })}
            </p>
            <ol className="dispatch-list">
              {result.options.slice(0, 3).map((o, i) => (
                <li key={o.id}>
                  <OptionCard option={o} best={i === 0} compact index={i} />
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
      <div className="dispatch-foot">
        <div className="dots" role="group" aria-label={d.hero.card.example}>
          {HERO_TRUCKS.map((tr, i) => (
            <button
              key={tr.id}
              type="button"
              className={i === idx ? 'is-active' : ''}
              aria-label={`${t(d.hero.card.truck, { n: tr.label })}, ${cityName(tr.city, lang)}`}
              aria-pressed={i === idx}
              onClick={() => i !== idx && go(i)}
            />
          ))}
        </div>
        <a href="#live-karte" className="link-arrow">
          {d.hero.card.more} <Icon name="arrow" size={16} />
        </a>
      </div>
    </div>
  );
}

export function Hero() {
  const { d } = useI18n();
  const [ref, inView] = useInView<HTMLElement>('100px');
  const reduced = useReducedMotion();
  return (
    <section className="hero" ref={ref} id="top">
      <AmbientMap active={inView && !reduced} />
      <div className="container hero-grid">
        <div className="hero-copy">
          <p className="pill-live">
            <span className="live-dot" aria-hidden="true" /> {d.hero.badge}
          </p>
          <h1>
            {d.hero.title1}
            <br />
            {d.hero.title2a}
            <em>{d.hero.title2b}</em>
          </h1>
          <p className="hero-lead">{d.hero.lead}</p>
          <div className="hero-ctas">
            <a className="btn btn-primary" href="#termin">
              {d.hero.cta1}
            </a>
            <a className="btn btn-ghost-dark" href="#live-karte">
              {d.hero.cta2}
            </a>
          </div>
          <ul className="hero-ticks">
            {d.hero.ticks.map((x) => (
              <li key={x}>
                <Icon name="check" size={15} /> {x}
              </li>
            ))}
          </ul>
        </div>
        <DispatchCard active={inView} />
      </div>
    </section>
  );
}
