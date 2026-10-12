import { useI18n } from '../i18n';
import { duration, eur, eurPrecise, num, when } from '../lib/format';
import { isFtl } from '../lib/loads';
import { cityName } from '../lib/network';
import type { Option } from '../lib/ranking';

export function routeLabel(o: Option, lang: 'de' | 'en') {
  const s = o.stops.slice(1).filter((c, i, arr) => i === 0 || arr[i - 1] !== c);
  return s.map((c) => cityName(c, lang)).join(' → ');
}

interface Props {
  option: Option;
  best?: boolean;
  selected?: boolean;
  compact?: boolean;
  onSelect?: () => void;
  index?: number;
}

export function OptionCard({ option: o, best, selected, compact, onSelect, index }: Props) {
  const { d, t, lang } = useI18n();
  const combo = o.loads.length > 1;
  const single = o.loads[0];
  const typeLabel = combo
    ? t(d.map.option.combo, { n: o.loads.length })
    : isFtl(single)
      ? d.map.option.ftl
      : d.map.option.part;
  const typeClass = combo ? 'chip-combo' : isFtl(single) ? 'chip-ftl' : 'chip-part';
  const sources = [...new Set(o.loads.map((l) => d.data.sources[l.source]))].join(' + ');
  const clientLine = combo
    ? `${o.loads.map((l) => d.data.clients[l.client]).join(' + ')} · ${sources}`
    : `${t(d.map.option.client, { client: d.data.clients[single.client] })} · ${t(d.map.option.via, { source: sources })}`;
  const totalKm = o.loadedKm + o.emptyKm;
  const Tag = onSelect ? 'button' : 'div';
  return (
    <Tag
      className={`option ${selected ? 'is-selected' : ''} ${compact ? 'is-compact' : ''}`}
      onClick={onSelect}
      {...(onSelect ? { type: 'button' as const, 'aria-pressed': !!selected } : {})}
      style={index !== undefined ? ({ '--i': index } as React.CSSProperties) : undefined}
    >
      <span className="option-head">
        <span className="option-route">{routeLabel(o, lang)}</span>
        {best && <span className="badge badge-best">{d.map.option.best}</span>}
      </span>
      <span className="option-client">{clientLine}</span>
      <span className="option-chips">
        <span className={`chip ${typeClass}`}>
          {typeLabel} · {t(d.map.option.ldm, { ldm: num(lang, o.ldm, 1) })}
        </span>
        <span className="chip">
          {o.emptyKm > 0
            ? t(d.map.option.km, { km: num(lang, o.loadedKm), empty: num(lang, o.emptyKm) })
            : t(d.map.option.kmNoEmpty, { km: num(lang, o.loadedKm) })}
        </span>
        {!compact && (
          <span className="chip">
            {t(d.map.option.drive, { h: duration(lang, o.driveMin) })}
            {o.rests > 0 ? `, ${d.map.option.rest}` : ''}
          </span>
        )}
        <span className="chip">{t(d.map.option.delivery, { when: when(lang, o.deliveryEta, true) })}</span>
        {!compact && <span className={`chip chip-follow is-${o.followUp}`}>{d.map.option.followUp[o.followUp]}</span>}
      </span>
      <span className="option-foot">
        <span className="option-rate">
          {t(d.map.option.rate, { rate: eur(lang, o.rate), perKm: eurPrecise(lang, o.rate / totalKm) })}
        </span>
        <span className="option-margin">
          <strong>{t(d.map.option.margin, { m: eur(lang, o.margin) })}</strong>
          {!compact && <small>{t(d.map.option.perKm, { v: eurPrecise(lang, o.marginPerKm) })}</small>}
        </span>
      </span>
    </Tag>
  );
}
