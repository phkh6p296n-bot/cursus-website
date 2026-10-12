import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../i18n';
import { useRaf } from '../../hooks/useRaf';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { clock, duration, eur, num, when } from '../../lib/format';
import { LYON_TRUCK, generateLoads, type Truck } from '../../lib/loads';
import { CITIES, cityName, cityXY, makeTrack, tripPolyline } from '../../lib/network';
import { rank, type Option, type SortMode } from '../../lib/ranking';
import { EuropeMap, fitView } from '../EuropeMap';
import { Icon } from '../Icon';
import { OptionCard, routeLabel } from '../OptionCard';
import { StopMarker, TripRoute, TruckMarker, positionOnTrip } from './RouteLayer';

export const MAP_ASPECT = 1.22;
const SHOWN = 4;

const SEARCH_DEFAULT: Truck = { id: 't5', label: '5', city: 'munich', freeAt: 9 * 60, driveLeftMin: 540, trailer: 'tautliner' };

function tracksFor(o: Option) {
  const hasEmpty = o.stops[0] !== o.stops[1];
  return {
    empty: hasEmpty ? makeTrack(tripPolyline([o.stops[0], o.stops[1]])) : null,
    loaded: makeTrack(tripPolyline(o.stops.slice(1))),
    emptyShare: o.emptyKm / (o.emptyKm + o.loadedKm || 1),
  };
}

function RejectedList({ rejected }: { rejected: Option[] }) {
  const { d, t, lang } = useI18n();
  const seen = new Set<string>();
  const firstOfKind = rejected.filter((o) => (seen.has(o.rejected!) ? false : (seen.add(o.rejected!), true))).slice(0, 4);
  const rest = rejected.length - firstOfKind.length;
  if (!rejected.length) return null;
  return (
    <div className="rejected">
      <p className="rejected-title">
        <Icon name="x" size={14} /> {d.map.rejected.title}
      </p>
      <ul>
        {firstOfKind.map((o) => (
          <li key={o.id}>
            <span className="rejected-route">{routeLabel(o, lang)}</span>
            <span className="rejected-why">
              {t(d.map.rejected.reasons[o.rejected!], {
                limit: o.missed ? when(lang, o.missed.limit) : '',
                at: o.missed ? when(lang, o.missed.at) : '',
                t: num(lang, o.tons, 1),
                m: eur(lang, o.margin),
              })}
            </span>
          </li>
        ))}
      </ul>
      {rest > 0 && <p className="rejected-more">{t(d.map.rejected.more, { n: rest })}</p>}
    </div>
  );
}

export function DecideScene({ mode, active }: { mode: 'decide' | 'search'; active: boolean }) {
  const { d, t, lang } = useI18n();
  const reduced = useReducedMotion();
  const [truck, setTruck] = useState<Truck>(mode === 'decide' ? LYON_TRUCK : SEARCH_DEFAULT);
  const [sort, setSort] = useState<SortMode>('perKm');
  const result = useMemo(() => rank(truck, generateLoads(truck.city, truck.freeAt), sort), [truck, sort]);
  const shown = useMemo(() => result.options.slice(0, SHOWN), [result]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [phase, setPhase] = useState<'pick' | 'drive' | 'done'>('pick');
  const [prog, setProg] = useState(0);

  useEffect(() => {
    setSelectedId(null);
    setPhase('pick');
    setProg(0);
  }, [truck, sort]);

  const selected = shown.find((o) => o.id === selectedId) ?? null;
  const tracks = useMemo(() => shown.map((o) => ({ id: o.id, ...tracksFor(o) })), [shown]);
  const selTracks = tracks.find((x) => x.id === selected?.id);

  useRaf(
    (dt) =>
      setProg((p) => {
        const n = Math.min(1, p + dt / 6.5);
        if (n >= 1) setPhase('done');
        return n;
      }),
    phase === 'drive' && active,
  );

  const focus = selected && phase !== 'pick' ? [selected] : shown;
  const pts = [cityXY(truck.city), ...focus.flatMap((o) => tripPolyline(o.stops))];
  const view = fitView(pts, MAP_ASPECT, 70, 300);

  const labelIds = new Set<string>([truck.city, ...focus.flatMap((o) => o.stops.slice(1))]);
  const labels = [...labelIds].map((id) => ({ id, name: cityName(id, lang), strong: id === truck.city }));

  const accept = () => {
    if (!selected) return;
    if (reduced) {
      setProg(1);
      setPhase('done');
    } else {
      setProg(0);
      setPhase('drive');
    }
  };

  const truckPos: [number, number] =
    selected && selTracks && phase !== 'pick'
      ? positionOnTrip(selTracks.empty, selTracks.loaded, selTracks.emptyShare, prog)
      : cityXY(truck.city);

  const cities = useMemo(() => [...CITIES].sort((a, b) => a[lang].localeCompare(b[lang], lang)), [lang]);
  const times = Array.from({ length: 29 }, (_, i) => 6 * 60 + i * 30);

  return (
    <div className="scene">
      <div className="scene-map">
        <EuropeMap view={view} labels={labels} label={d.map.chapters[mode].title}>
          {({ u }) => (
            <g>
              {tracks.map((tr, i) => {
                const isSel = tr.id === selected?.id;
                if (phase !== 'pick' && !isSel) return null;
                return (
                  <TripRoute
                    key={tr.id}
                    empty={tr.empty}
                    loaded={tr.loaded}
                    emptyShare={tr.emptyShare}
                    variant={isSel ? 'main' : selected ? 'faded' : i === 0 ? 'main' : 'alt'}
                    progress={isSel && phase !== 'pick' ? prog : undefined}
                  />
                );
              })}
              {phase === 'pick' &&
                shown.map((o, i) => {
                  const [x, y] = cityXY(o.stops[o.stops.length - 1]);
                  return <StopMarker key={o.id} x={x - 12 * u} y={y - 12 * u} u={u} n={i + 1} />;
                })}
              {selected &&
                phase !== 'pick' &&
                selected.stops.slice(1).map((c, i) => {
                  const [x, y] = cityXY(c);
                  return <StopMarker key={`${c}-${i}`} x={x} y={y} u={u} />;
                })}
              <TruckMarker x={truckPos[0]} y={truckPos[1]} u={u} label={t(d.hero.card.truck, { n: truck.label })} />
            </g>
          )}
        </EuropeMap>
        <p className="map-note">{d.map.disclaimer}</p>
      </div>

      <div className="scene-panel">
        <div className="panel-truck">
          <span className="plate" aria-hidden="true">{truck.label}</span>
          <div>
            <p className="panel-truck-title">
              {t(d.hero.card.truck, { n: truck.label })} · {t(d.hero.card.free, { city: cityName(truck.city, lang), when: when(lang, truck.freeAt) })}
            </p>
            <p className="panel-truck-sub">
              {t(d.hero.card.left, { time: duration(lang, truck.driveLeftMin) })} · {truck.trailer === 'reefer' ? d.map.search.reefer : d.map.search.tautliner}
            </p>
          </div>
        </div>

        {mode === 'search' && (
          <div className="search-form">
            <label className="field">
              <span>{d.map.search.city}</span>
              <select id="search-city" value={truck.city} onChange={(e) => setTruck({ ...truck, city: e.target.value })}>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c[lang]}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>{d.map.search.time}</span>
              <select id="search-time" value={truck.freeAt} onChange={(e) => setTruck({ ...truck, freeAt: Number(e.target.value) })}>
                {times.map((m) => (
                  <option key={m} value={m}>
                    {d.map.search.today} {clock(m)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field field-wide">
              <span>
                {d.map.search.left}: <strong>{duration(lang, truck.driveLeftMin)}</strong>
              </span>
              <input
                id="search-left"
                type="range"
                min={60}
                max={540}
                step={30}
                value={truck.driveLeftMin}
                onChange={(e) => setTruck({ ...truck, driveLeftMin: Number(e.target.value) })}
              />
            </label>
            <div className="field field-wide">
              <span>{d.map.search.trailer}</span>
              <div className="segmented segmented-sm">
                {(['tautliner', 'reefer'] as const).map((tr) => (
                  <button key={tr} type="button" aria-pressed={truck.trailer === tr} className={truck.trailer === tr ? 'is-active' : ''} onClick={() => setTruck({ ...truck, trailer: tr })}>
                    {d.map.search[tr]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="panel-bar">
          <p className="panel-checked">
            <Icon name="check" size={14} /> {t(d.map.checked, { n: result.offers, c: result.combos })}
          </p>
          <label className="sort">
            <span className="sr-only">{d.map.sort.label}</span>
            <select id={`sort-${mode}`} value={sort} onChange={(e) => setSort(e.target.value as SortMode)}>
              <option value="perKm">{d.map.sort.perKm}</option>
              <option value="total">{d.map.sort.total}</option>
              <option value="empty">{d.map.sort.empty}</option>
            </select>
          </label>
        </div>

        {shown.length === 0 ? (
          <p className="panel-empty">{d.map.noResults}</p>
        ) : (
          <ol className="option-list">
            {shown.map((o, i) => (
              <li key={o.id} className={selected?.id === o.id ? 'is-selected' : ''}>
                <span className="option-no" aria-hidden="true">{i + 1}</span>
                <OptionCard
                  option={o}
                  best={i === 0 && sort === 'perKm'}
                  selected={selected?.id === o.id}
                  compact={selected?.id !== o.id}
                  onSelect={phase === 'drive' ? undefined : () => { setSelectedId(o.id); setPhase('pick'); setProg(0); }}
                />
                {selected?.id === o.id && (
                  <div className="option-actions">
                    {phase === 'pick' && (
                      <button type="button" className="btn btn-primary btn-sm" onClick={accept}>
                        {d.map.option.accept} <Icon name="arrow" size={16} />
                      </button>
                    )}
                    {phase === 'drive' && (
                      <p className="drive-status">
                        <span className="live-dot" aria-hidden="true" /> {d.map.option.driving}{' '}
                        <span className="tabular">{num(lang, prog * (o.emptyKm + o.loadedKm))} km</span>
                      </p>
                    )}
                    {phase === 'done' && (
                      <>
                        <p className="drive-status is-done">
                          <Icon name="check" size={16} />{' '}
                          {t(d.map.option.result, { km: num(lang, o.emptyKm + o.loadedKm), empty: num(lang, o.emptyKm), m: eur(lang, o.margin) })}
                        </p>
                        <button type="button" className="btn btn-quiet btn-sm" onClick={() => { setPhase('pick'); setProg(0); setSelectedId(null); }}>
                          <Icon name="restart" size={15} /> {d.map.option.reset}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
        <RejectedList rejected={result.rejected} />
      </div>
    </div>
  );
}
