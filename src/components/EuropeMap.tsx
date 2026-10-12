import { memo, useEffect, useRef, useState, type ReactNode } from 'react';
import { CITY_XY, GRATICULE_PATH, LAND_PATH, MAP_H, MAP_W } from '../data/map.generated';
import { useReducedMotion } from '../hooks/useReducedMotion';
import type { CityId } from '../lib/network';

export interface View {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const FULL_VIEW: View = { x: 0, y: 0, w: MAP_W, h: MAP_H };

/** A view that contains all points with padding and has the given width/height ratio. */
export function fitView(points: [number, number][], aspect: number, pad = 60, minW = 260): View {
  if (!points.length) return FULL_VIEW;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of points) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  let w = Math.max(minW, x1 - x0 + pad * 2);
  let h = Math.max(y1 - y0 + pad * 2, w / aspect);
  w = Math.max(w, h * aspect);
  h = w / aspect;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function useAnimatedView(target: View, duration = 800) {
  const reduced = useReducedMotion();
  const [view, setView] = useState(target);
  const fromRef = useRef(target);
  const viewRef = useRef(target);
  viewRef.current = view;
  const key = `${target.x.toFixed(1)},${target.y.toFixed(1)},${target.w.toFixed(1)},${target.h.toFixed(1)}`;
  useEffect(() => {
    if (reduced) {
      setView(target);
      return;
    }
    fromRef.current = viewRef.current;
    const start = performance.now();
    let id = requestAnimationFrame(function step(now) {
      const p = Math.min(1, (now - start) / duration);
      const e = ease(p);
      const f = fromRef.current;
      setView({
        x: f.x + (target.x - f.x) * e,
        y: f.y + (target.y - f.y) * e,
        w: f.w + (target.w - f.w) * e,
        h: f.h + (target.h - f.h) * e,
      });
      if (p < 1) id = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, reduced]);
  return view;
}

const Base = memo(function Base({ graticule }: { graticule: boolean }) {
  return (
    <g>
      {graticule && <path d={GRATICULE_PATH} className="map-graticule" vectorEffect="non-scaling-stroke" />}
      <path d={LAND_PATH} className="map-land" vectorEffect="non-scaling-stroke" />
    </g>
  );
});

/** Drops labels that would collide with an already placed one (strong labels win). */
function placeLabels(labels: { id: CityId; name: string; strong?: boolean }[], u: number) {
  const sorted = [...labels].sort((a, b) => Number(!!b.strong) - Number(!!a.strong));
  const placed: { x: number; y: number; w: number }[] = [];
  const out: typeof labels = [];
  for (const l of sorted) {
    const [x, y] = CITY_XY[l.id];
    const w = (l.name.length * 7 + 8) * u;
    const clash = placed.some((p) => Math.abs(p.y - y) < 15 * u && x < p.x + p.w && p.x < x + w);
    if (clash) continue;
    placed.push({ x, y, w });
    out.push(l);
  }
  return out;
}

export interface MapCtx {
  /** Map units per screen pixel, to size markers and labels in pixels. */
  u: number;
  view: View;
}

interface Props {
  view?: View;
  labels?: { id: CityId; name: string; strong?: boolean }[];
  className?: string;
  label: string;
  graticule?: boolean;
  children?: (ctx: MapCtx) => ReactNode;
}

export function EuropeMap({ view: target = FULL_VIEW, labels = [], className, label, graticule = true, children }: Props) {
  const view = useAnimatedView(target);
  const ref = useRef<SVGSVGElement | null>(null);
  const [px, setPx] = useState(800);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => setPx(Math.max(200, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const u = view.w / px;
  return (
    <svg
      ref={ref}
      className={`europe-map ${className ?? ''}`}
      viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={label}
    >
      <rect x={-500} y={-500} width={MAP_W + 1000} height={MAP_H + 1000} className="map-sea" />
      <Base graticule={graticule} />
      {placeLabels(labels, u).map((l) => {
        const [x, y] = CITY_XY[l.id];
        return (
          <g key={l.id} className={`map-city ${l.strong ? 'is-strong' : ''}`}>
            <circle cx={x} cy={y} r={2.6 * u} />
            <text x={x + 6 * u} y={y + 4 * u} fontSize={12 * u}>
              {l.name}
            </text>
          </g>
        );
      })}
      {children?.({ u, view })}
    </svg>
  );
}
