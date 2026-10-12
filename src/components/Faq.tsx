import { useI18n } from '../i18n';
import { Icon } from './Icon';

export function Faq() {
  const { d } = useI18n();
  return (
    <section className="section section-paper" id="faq">
      <div className="container faq-grid">
        <div className="section-head">
          <p className="eyebrow">{d.faq.eyebrow}</p>
          <h2>{d.faq.title}</h2>
        </div>
        <div className="faq">
          {d.faq.items.map((it, i) => (
            <details key={i} open={i === 0}>
              <summary>
                {it.q}
                <Icon name="chevron" size={18} />
              </summary>
              <p>{it.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
