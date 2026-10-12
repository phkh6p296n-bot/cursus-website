import { memo, useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../i18n';
import { useRaf } from '../../hooks/useRaf';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { clock, eur, num, pct } from '../../lib/format';
import { CITIES, cityXY } from '../../lib/network';
import { SIM_HOURS, runSim, type Policy, type SimLeg, type SimRun } from '../../lib/sim';
import { EuropeMap, fitView } from '../EuropeMap';
import { Icon } from '../Icon';
import { MAP_ASPECT } from './DecideScene';

const H = SIM_HOURS * 60;
const SIM_SECONDS = 38;
const START_HOUR = 6;

const DoneLegs = memo(function DoneLegs({ legs }: { legs: SimLeg[] }) {
  return (
    <g>
      {legs.map((l, i) =>
        l.track ? <path key={i} d={l.track.d} className={l.kind === 'empty' ? 'fleet-empty' : 'fleet-loaded'} vectorEffect="non-scaling-stroke" /> : null,
      )}
    </g>
  );
});

function idleHours(run: SimRun, t: number) {
  let m = 0;
  for (const tr of run.trucks) for (const l of tr.legs) if (l.kind === 'wait' && l.t0 < t) m += Math.min(t, l.t1) - l.t0;
  return m / 60;
}

export function FleetScene({ active }: { active: boolean }) {
  const { d, t: tt, lang } = useI18n();
  const runs = useMemo(() => ({ manual: runSim('manual'), cursus: runSim('cursus') }), []);
  const [policy, setPolicy] = useState<Policy>('manual');
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const run = runs[policy];
  const reduced = useReducedMotion();

  useEffect(() => {
    if (active && !reduced) setPlaying(true);
  }, [active, reduced]);

  useRaf(
    (dt) =>
      setT((v) => {
        const n = Math.min(H, v + (dt * H) / SIM_SECONDS);
        if (n >= H) setPlaying(false);
        return n;
      }),
    playing && active,
  );

  const view = useMemo(() => fitView(CITIES.map((c) => cityXY(c.id)), MAP_ASPECT, 30), []);
  // Completed legs only change when a leg finishes, so bucket them by count for memoisation.
  const done = run.trucks.map((tr) => tr.legs.filter((l) => l.t1 <= t));
  const doneKey = done.map((x) => x.length).join(',');
  const doneLegs = useMemo(() => done.flat(), [doneKey, policy]); // eslint-disable-line react-hooks/exhaustive-deps

  const totals = run.totalsAt(t);
  const idle = idleHours(run, t);
  const day = Math.floor((t + START_HOUR * 60) / 1440) + 1;
  const finished = t >= H;

  const toggle = () => {
    if (finished) setT(0);
    setPlaying(!playing || finished);
  };

  return (
    <div className="scene">
      <div className="scene-map">
        <EuropeMap view={view} label={d.map.chapters.fleet.title} graticule={false}>
          {({ u }) => (
            <g>
              <DoneLegs legs={doneLegs} />
              {run.trucks.map((tr) => {
                const leg = tr.legs.find((l) => l.t0 <= t && t < l.t1);
                let pos = cityXY(tr.start);
                if (leg) {
                  if (leg.track) {
                    const f = (t - leg.t0) / (leg.t1 - leg.t0);
                    pos = leg.track.at(f);
                    return (
                      <g key={tr.id}>
                        <path d={leg.track.upTo(f)} className={leg.kind === 'empty' ? 'fleet-empty' : 'fleet-loaded'} vectorEffect="non-scaling-stroke" />
                        <circle cx={pos[0]} cy={pos[1]} r={4.5 * u} className={`fleet-truck ${leg.kind === 'empty' ? 'is-empty' : ''}`} />
                      </g>
                    );
                  }
                  pos = cityXY(leg.from);
                } else {
                  const last = [...tr.legs].reverse().find((l) => l.t1 <= t);
                  if (last) pos = cityXY(last.to);
                }
                return <circle key={tr.id} cx={pos[0]} cy={pos[1]} r={4.5 * u} className="fleet-truck is-idle" />;
              })}
            </g>
          )}
        </EuropeMap>
        <div className="map-legend">
          <span><i className="lg-loaded" /> {d.map.fleet.legendLoaded}</span>
          <span><i className="lg-empty" /> {d.map.fleet.legendEmpty}</span>
        </div>
      </div>

      <div className="scene-panel">
        <div className="segmented" role="group" aria-label={d.map.chapters.fleet.tab}>
          {(['manual', 'cursus'] as const).map((p) => (
            <button key={p} type="button" aria-pressed={policy === p} className={policy === p ? 'is-active' : ''} onClick={() => setPolicy(p)}>
              {d.map.fleet[p]}
            </button>
          ))}
        </div>
        <div className="fleet-controls">
          <button type="button" className="btn btn-primary btn-sm" onClick={toggle}>
            <Icon name={playing ? 'pause' : finished ? 'restart' : 'play'} size={15} />
            {playing ? d.map.fleet.pause : finished ? d.map.fleet.restart : d.map.fleet.play}
          </button>
          <span className="fleet-clock tabular">{tt(d.map.fleet.day, { d: day, time: clock(t + START_HOUR * 60) })}</span>
        </div>
        <div className="fleet-progress" aria-hidden="true">
          <span style={{ width: `${(t / H) * 100}%` }} />
        </div>
        <dl className="metrics">
          <div>
            <dt>{d.map.fleet.share}</dt>
            <dd className="tabular">{pct(lang, totals.emptyShare)}</dd>
          </div>
          <div>
            <dt>{d.map.fleet.emptyKm}</dt>
            <dd className="tabular">{num(lang, totals.emptyKm)}</dd>
          </div>
          <div>
            <dt>{d.map.fleet.margin}</dt>
            <dd className="tabular">{eur(lang, totals.margin)}</dd>
          </div>
          <div>
            <dt>{d.map.fleet.idle}</dt>
            <dd className="tabular">{tt(d.map.fleet.hours, { h: num(lang, idle) })}</dd>
          </div>
        </dl>
        {finished && (
          <div className="fleet-compare">
            <p className="fleet-compare-title">{d.map.fleet.compare}</p>
            <table>
              <thead>
                <tr>
                  <th />
                  <th>{d.map.fleet.manual}</th>
                  <th>{d.map.fleet.cursus}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>{d.map.fleet.share}</th>
                  <td className="tabular">{pct(lang, runs.manual.final.emptyShare)}</td>
                  <td className="tabular">{pct(lang, runs.cursus.final.emptyShare)}</td>
                </tr>
                <tr>
                  <th>{d.map.fleet.margin}</th>
                  <td className="tabular">{eur(lang, runs.manual.final.margin)}</td>
                  <td className="tabular">{eur(lang, runs.cursus.final.margin)}</td>
                </tr>
                <tr>
                  <th>{d.map.fleet.idle}</th>
                  <td className="tabular">{tt(d.map.fleet.hours, { h: num(lang, idleHours(runs.manual, H)) })}</td>
                  <td className="tabular">{tt(d.map.fleet.hours, { h: num(lang, idleHours(runs.cursus, H)) })}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        <p className="fleet-caption">{d.map.fleet.caption}</p>
      </div>
    </div>
  );
}
