import { useState } from 'react';
import { useI18n } from '../i18n';
import { Icon } from './Icon';
import { Logo } from './Logo';

export function Nav() {
  const { d, lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const links = [
    ['#so-gehts', d.nav.how],
    ['#live-karte', d.nav.map],
    ['#rechner', d.nav.calc],
    ['#pilot', d.nav.pilot],
    ['#faq', d.nav.faq],
  ] as const;
  return (
    <header className="nav">
      <div className="container nav-inner">
        <a href="#top" className="nav-logo" aria-label="cursus">
          <Logo />
        </a>
        <nav className={`nav-links ${open ? 'is-open' : ''}`} aria-label="Main">
          {links.map(([href, label]) => (
            <a key={href} href={href} onClick={() => setOpen(false)}>
              {label}
            </a>
          ))}
          <a href="#termin" className="btn btn-primary nav-cta-mobile" onClick={() => setOpen(false)}>
            {d.nav.cta}
          </a>
        </nav>
        <div className="nav-right">
          <div className="lang" role="group" aria-label={d.nav.lang}>
            {(['de', 'en'] as const).map((l) => (
              <button key={l} type="button" aria-pressed={lang === l} className={lang === l ? 'is-active' : ''} onClick={() => setLang(l)}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <a href="#termin" className="btn btn-primary btn-sm nav-cta">
            {d.nav.cta}
          </a>
          <button type="button" className="nav-burger" aria-expanded={open} aria-label={open ? d.nav.close : d.nav.menu} onClick={() => setOpen(!open)}>
            <Icon name={open ? 'x' : 'menu'} size={22} />
          </button>
        </div>
      </div>
    </header>
  );
}
