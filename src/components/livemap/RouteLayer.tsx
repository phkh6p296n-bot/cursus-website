import type { Track } from '../../lib/network';

export function TruckMarker({ x, y, u, label, alert }: { x: number; y: number; u: number; label?: string; alert?: boolean }) {
  return (
    <g className={`truck-marker ${alert ? 'is-alert' : ''}`} transform={`translate(${x} ${y})`}>
      {alert && <circle r={14 * u} className="truck-pulse" />}
      <circle r={7 * u} className="truck-dot" />
      {label && (
        <g transform={`translate(${-(label.length * 7 + 18) * u} ${-14 * u})`}>
          <rect x={0} y={-9 * u} width={(label.length * 7 + 10) * u} height={16 * u} rx={3 * u} className="truck-plate" />
          <text x={5 * u} y={3.5 * u} fontSize={11 * u} className="truck-plate-text">
            {label}
          </text>
        </g>
      )}
    </g>
  );
}

export function StopMarker({ x, y, u, n }: { x: number; y: number; u: number; n?: number | string }) {
  return (
    <g className="stop-marker" transform={`translate(${x} ${y})`}>
      <circle r={(n !== undefined ? 8 : 4) * u} />
      {n !== undefined && (
        <text y={3.8 * u} fontSize={10.5 * u} textAnchor="middle">
          {n}
        </text>
      )}
    </g>
  );
}

/** Empty part dashed, loaded part solid. `progress` 0..1 draws the driven trail on top. */
export function TripRoute({
  empty,
  loaded,
  emptyShare,
  variant,
  progress,
}: {
  empty: Track | null;
  loaded: Track;
  emptyShare: number;
  variant: 'main' | 'alt' | 'faded';
  progress?: number;
}) {
  const pE = progress === undefined ? 0 : emptyShare > 0 ? Math.min(1, progress / emptyShare) : 1;
  const pL = progress === undefined ? 0 : Math.max(0, (progress - emptyShare) / (1 - emptyShare || 1));
  return (
    <g className={`trip trip-${variant}`}>
      {empty && <path d={empty.d} className="route-empty" vectorEffect="non-scaling-stroke" />}
      <path d={loaded.d} className="route-loaded" vectorEffect="non-scaling-stroke" />
      {progress !== undefined && progress > 0 && (
        <>
          {empty && <path d={empty.upTo(pE)} className="trail-empty" vectorEffect="non-scaling-stroke" />}
          {pL > 0 && <path d={loaded.upTo(pL)} className="trail-loaded" vectorEffect="non-scaling-stroke" />}
        </>
      )}
    </g>
  );
}

export function positionOnTrip(empty: Track | null, loaded: Track, emptyShare: number, progress: number): [number, number] {
  if (empty && progress < emptyShare) return empty.at(progress / emptyShare);
  return loaded.at(emptyShare >= 1 ? 1 : (progress - emptyShare) / (1 - emptyShare));
}
