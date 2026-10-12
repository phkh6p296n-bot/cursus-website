import { useI18n } from '../i18n';
import { Logo } from './Logo';

export function Footer() {
  const { d } = useI18n();
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <Logo />
          <p>{d.footer.story}</p>
        </div>
        <div className="footer-links">
          {/* Imprint and privacy policy are legally required in AT, DE and CH before launch. */}
          <span>
            {d.footer.imprint} <small>({d.footer.soon})</small>
          </span>
          <span>
            {d.footer.privacy} <small>({d.footer.soon})</small>
          </span>
          <span>{d.footer.rights}</span>
        </div>
      </div>
    </footer>
  );
}
