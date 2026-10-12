import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../i18n';
import { useRaf } from '../../hooks/useRaf';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { cityName, makeTrack, tripPolyline, type CityId } from '../../lib/network';
import { EuropeMap, fitView } from '../EuropeMap';
import { Icon } from '../Icon';
import { MAP_ASPECT } from './DecideScene';
import { TruckMarker } from './RouteLayer';

const LENGTH = 26;

interface ScriptTruck {
  label: string;
  stops: CityId[];
  from: number;
  to: number;
  /** Index of the alert this truck raises, and when (seconds into the scene). */
  alert: number;
  at: number;
  /** The truck stops moving when its alert fires. */
  halts?: boolean;
}

const SCRIPT: ScriptTruck[] = [
  { label: '7', stops: ['verona', 'innsbruck', 'munich'], from: 0.04, to: 0.93, alert: 0, at: 4.5 },
  { label: '3', stops: ['lyon', 'besancon', 'basel'], from: 0.08, to: 0.9, alert: 1, at: 10, halts: true },
  { label: '11', stops: ['rotterdam', 'duisburg', 'cologne', 'frankfurt'], from: 0.03, to: 0.9, alert: 2, at: 16 },
];

export function AlertsScene({ active }: { active: boolean }) {
  const { d, t: tt, lang } = useI18n();
  const reduced = useReducedMotion();
  const [tau, setTau] = useState(reduced ? LENGTH : 0);
  const [resolved, setResolved] = useState<Set<number>>(new Set());
  const tracks = useMemo(() => SCRIPT.map((s) => makeTrack(tripPolyline(s.stops))), []);
  const view = useMemo(() => fitView(tracks.flatMap((tr) => tr.pts), MAP_ASPECT, 60), [tracks]);

  useRaf((dt) => setTau((v) => Math.min(LENGTH, v + dt)), active && tau < LENGTH);
  useEffect(() => {
    if (reduced) setTau(LENGTH);
  }, [reduced]);

  const fired = SCRIPT.filter((s) => tau >= s.at).map((s) => s.alert);
  const progressOf = (s: ScriptTruck) => {
    const tEff = s.halts && tau >= s.at ? s.at : tau;
    return s.from + (s.to - s.from) * (tEff / LENGTH);
  };

  const labels = [...new Set(SCRIPT.flatMap((s) => [s.stops[0], s.stops[s.stops.length - 1]]))].map((id) => ({ id, name: cityName(id, lang) }));

  return (
    <div className="scene">
      <div className="scene-map">
        <EuropeMap view={view} labels={labels} label={d.map.chapters.alerts.title}>
          {({ u }) => (
            <g>
              {SCRIPT.map((s, i) => {
                const p = progressOf(s);
                const tr = tracks[i];
                const [x, y] = tr.at(p);
                const alerting = fired.includes(s.alert) && !resolved.has(s.alert);
                return (
                  <g key={s.label}>
                    <path d={tr.d} className="route-plan" vectorEffect="non-scaling-stroke" />
                    <path d={tr.upTo(p)} className="trail-loaded" vectorEffect="non-scaling-stroke" />
                    <TruckMarker x={x} y={y} u={u} label={tt(d.hero.card.truck, { n: s.label })} alert={alerting} />
                  </g>
                );
              })}
            </g>
          )}
        </EuropeMap>
        <p className="map-note">{d.map.alerts.thread}</p>
      </div>
      <div className="scene-panel">
        <div className="feed-head">
          <p className="feed-title">
            {d.map.alerts.feed} <span className="count">{fired.length}</span>
          </p>
          {tau >= LENGTH && (
            <button type="button" className="btn btn-quiet btn-sm" onClick={() => { setTau(0); setResolved(new Set()); }}>
              <Icon name="restart" size={15} /> {d.map.alerts.replay}
            </button>
          )}
        </div>
        {fired.length === 0 && <p className="panel-empty">{d.map.alerts.waiting}</p>}
        <ol className="feed" aria-live="polite">
          {fired.map((idx) => {
            const a = d.map.alerts.items[idx];
            const isDone = resolved.has(idx);
            return (
              <li key={idx} className={`alert ${isDone ? 'is-done' : ''}`}>
                <span className="alert-icon" aria-hidden="true">
                  <Icon name={isDone ? 'check' : idx === 2 ? 'clock' : 'alert'} size={18} />
                </span>
                <div className="alert-body">
                  <p className="alert-title">{a.title}</p>
                  <p className="alert-detail">{a.detail}</p>
                  <p className="alert-source">{a.source}</p>
                  {isDone ? (
                    <p className="alert-done">
                      <Icon name="check" size={14} /> {a.done}
                    </p>
                  ) : (
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => setResolved(new Set([...resolved, idx]))}>
                      {a.action}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
