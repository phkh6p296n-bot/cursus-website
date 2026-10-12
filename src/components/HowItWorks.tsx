import { useI18n } from '../i18n';
import { Icon, type IconName } from './Icon';

const ICONS: IconName[] = ['plug', 'rank', 'hand', 'loop'];

/** The four steps as relay stations along one road, after the cursus publicus. */
export function HowItWorks() {
  const { d } = useI18n();
  return (
    <section className="section section-paper" id="so-gehts">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">{d.how.eyebrow}</p>
          <h2>{d.how.title}</h2>
        </div>
        <ol className="relay">
          {d.how.steps.map((s, i) => (
            <li key={s.title} className="relay-step">
              <span className="relay-stop" aria-hidden="true">
                <Icon name={ICONS[i]} size={20} />
              </span>
              <span className="relay-n">{String(i + 1).padStart(2, '0')}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
        <p className="how-foot">{d.how.footnote}</p>
      </div>
    </section>
  );
}
