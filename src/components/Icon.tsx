const PATHS = {
  check: 'M4 10.5l4 4 8-9',
  x: 'M5 5l10 10M15 5L5 15',
  arrow: 'M4 10h11M11 5l5 5-5 5',
  play: 'M6 4l10 6-10 6z',
  pause: 'M6 4v12M14 4v12',
  restart: 'M4 10a6 6 0 1 0 2-4.5M4 3v3.5h3.5',
  chevron: 'M5 8l5 5 5-5',
  alert: 'M10 3l8 14H2zM10 8v4M10 14.5v.5',
  clock: 'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM10 6v4l3 2',
  menu: 'M3 6h14M3 10h14M3 14h14',
  plug: 'M7 3v4M13 3v4M5 7h10v3a5 5 0 0 1-10 0zM10 15v3',
  rank: 'M4 15V9M10 15V5M16 15v-3',
  hand: 'M7 10V4.5a1.5 1.5 0 0 1 3 0V9M10 8.5V3.5a1.5 1.5 0 0 1 3 0V9M13 8.5V5a1.5 1.5 0 0 1 3 0v6c0 3.5-2.5 6-6 6s-5-2-6.5-4.5L3 9.5a1.5 1.5 0 0 1 2.4-1.7L7 10',
  loop: 'M15 7a6 6 0 0 0-10.5-1M5 13a6 6 0 0 0 10.5 1M4 3v3h3M16 17v-3h-3',
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 18, className }: { name: IconName; size?: number; className?: string }) {
  const filled = name === 'play';
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
