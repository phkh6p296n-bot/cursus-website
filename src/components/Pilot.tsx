import { useI18n } from '../i18n';

export function Pilot() {
  const { d } = useI18n();
  return (
    <section className="section section-paper" id="pilot">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">{d.pilot.eyebrow}</p>
          <h2>{d.pilot.title}</h2>
          <p className="section-lead">{d.pilot.lead}</p>
        </div>
        <ol className="pilot-steps">
          {d.pilot.steps.map((s, i) => (
            <li key={s.title}>
              <span className="pilot-when">{s.when}</span>
              <h3>
                <span className="pilot-n">{i + 1}</span> {s.title}
              </h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
        <figure className="partner">
          <figcaption>{d.pilot.partnerLabel}</figcaption>
          <p>{d.pilot.partner}</p>
        </figure>
      </div>
    </section>
  );
}
