/** cursus mark: a ring of road segments that opens to the right, where the truck enters. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={`logo ${className ?? ''}`}>
      <svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true">
        <path d="M31.5 28A14 14 0 1 1 31.5 12" fill="none" stroke="currentColor" strokeWidth="5" strokeDasharray="6.2 2.4" />
        <rect x="26.5" y="17" width="8.2" height="6" rx="1.2" fill="var(--orange)" />
        <rect x="35.2" y="18.6" width="2.8" height="4.4" rx="0.8" fill="var(--orange)" />
      </svg>
      <span className="logo-word">cursus</span>
    </span>
  );
}
