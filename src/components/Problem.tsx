import { useI18n } from '../i18n';

/** Share of empty kilometres as a road strip: one in five segments is grey. */
function EmptyStrip() {
  const segs = Array.from({ length: 30 }, (_, i) => i);
  return (
    <svg className="empty-strip" viewBox="0 0 300 14" preserveAspectRatio="none" aria-hidden="true">
      {segs.map((i) => (
        <rect key={i} x={i * 10 + 1} y={3} width={8} height={8} rx={1.5} className={i % 5 === 4 ? 'is-empty' : ''} />
      ))}
    </svg>
  );
}

export function Problem() {
  const { d } = useI18n();
  return (
    <section className="section section-paper" id="problem">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">{d.problem.eyebrow}</p>
          <h2>{d.problem.title}</h2>
        </div>
        <EmptyStrip />
        <dl className="stats">
          {d.problem.stats.map((s) => (
            <div className="stat" key={s.value}>
              <dt>{s.value}</dt>
              <dd>
                {s.label}
                <span className="stat-src">{s.source}</span>
              </dd>
            </div>
          ))}
        </dl>
        <div className="problem-foot">
          <p className="problem-bridge">{d.problem.bridge}</p>
          <p className="problem-honest">{d.problem.honest}</p>
        </div>
      </div>
    </section>
  );
}
