import { useI18n } from '../i18n';

export function Team() {
  const { d } = useI18n();
  return (
    <section className="section section-white" id="team">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">{d.team.eyebrow}</p>
          <h2>{d.team.title}</h2>
        </div>
        <div className="team">
          {d.team.members.map((m, i) => (
            <article className="member" key={i}>
              {/* Replace with <img src="/team/name.jpg" alt="Name"> once photos exist. */}
              <div className="member-photo" aria-hidden="true">
                <span>{d.team.photo}</span>
              </div>
              <div>
                <h3>{m.name}</h3>
                <p className="member-role">{m.role}</p>
                <p>{m.bio}</p>
              </div>
            </article>
          ))}
          <article className="member member-hiring">
            <p className="member-role">{d.team.hiringLabel}</p>
            <p>{d.team.hiring}</p>
          </article>
        </div>
      </div>
    </section>
  );
}
