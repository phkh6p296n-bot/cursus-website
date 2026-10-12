import { useState } from 'react';
import { useI18n } from '../i18n';
import { eur, num } from '../lib/format';
import { CARRIER_DEFAULTS, FORWARDER_DEFAULTS, carrierSavings, forwarderSavings } from '../lib/roi';
import { Icon } from './Icon';

interface SliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}

function Slider({ id, label, value, min, max, step, display, onChange }: SliderProps) {
  return (
    <label className="slider" htmlFor={id}>
      <span className="slider-top">
        <span>{label}</span>
        <output className="tabular">{display}</output>
      </span>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ '--fill': `${((value - min) / (max - min)) * 100}%` } as React.CSSProperties}
      />
    </label>
  );
}

export function Roi() {
  const { d, t, lang } = useI18n();
  const [tab, setTab] = useState<'forwarder' | 'carrier'>('forwarder');
  const [fw, setFw] = useState(FORWARDER_DEFAULTS);
  const [ca, setCa] = useState(CARRIER_DEFAULTS);
  const f = forwarderSavings(fw);
  const c = carrierSavings(ca);
  const res = tab === 'forwarder' ? f : c;
  const other = tab === 'forwarder' ? f.purchaseValue : c.kmValue;
  const otherShare = res.total ? other / res.total : 0;
  const hoursLabel = (h: number) => t(d.roi.out.hoursValue, { h: num(lang, h) });

  return (
    <section className="section section-white" id="rechner">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">{d.roi.eyebrow}</p>
          <h2>{d.roi.title}</h2>
          <p className="section-lead">{d.roi.lead}</p>
        </div>
        <div className="roi">
          <div className="roi-inputs">
            <div className="segmented" role="tablist" aria-label={d.roi.eyebrow}>
              {(['forwarder', 'carrier'] as const).map((k) => (
                <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'is-active' : ''} onClick={() => setTab(k)}>
                  {d.roi.tabs[k]}
                </button>
              ))}
            </div>
            {tab === 'forwarder' ? (
              <>
                <Slider id="roi-loads" label={d.roi.inputs.loads} value={fw.loadsPerMonth} min={50} max={6000} step={10} display={num(lang, fw.loadsPerMonth)} onChange={(v) => setFw({ ...fw, loadsPerMonth: v })} />
                <Slider id="roi-freight" label={d.roi.inputs.freight} value={fw.avgFreight} min={400} max={4500} step={50} display={eur(lang, fw.avgFreight)} onChange={(v) => setFw({ ...fw, avgFreight: v })} />
                <Slider id="roi-fw-disp" label={d.roi.inputs.dispatchers} value={fw.dispatchers} min={1} max={40} step={1} display={num(lang, fw.dispatchers)} onChange={(v) => setFw({ ...fw, dispatchers: v })} />
                <Slider id="roi-fw-search" label={d.roi.inputs.search} value={fw.searchHoursPerDay} min={0.5} max={6} step={0.5} display={`${num(lang, fw.searchHoursPerDay, 1)} h`} onChange={(v) => setFw({ ...fw, searchHoursPerDay: v })} />
              </>
            ) : (
              <>
                <Slider id="roi-trucks" label={d.roi.inputs.trucks} value={ca.trucks} min={5} max={500} step={5} display={num(lang, ca.trucks)} onChange={(v) => setCa({ ...ca, trucks: v })} />
                <Slider id="roi-km" label={d.roi.inputs.km} value={ca.kmPerTruck} min={40000} max={160000} step={5000} display={`${num(lang, ca.kmPerTruck)} km`} onChange={(v) => setCa({ ...ca, kmPerTruck: v })} />
                <Slider id="roi-ca-disp" label={d.roi.inputs.dispatchers} value={ca.dispatchers} min={1} max={30} step={1} display={num(lang, ca.dispatchers)} onChange={(v) => setCa({ ...ca, dispatchers: v })} />
                <Slider id="roi-ca-search" label={d.roi.inputs.search} value={ca.searchHoursPerDay} min={0.5} max={6} step={0.5} display={`${num(lang, ca.searchHoursPerDay, 1)} h`} onChange={(v) => setCa({ ...ca, searchHoursPerDay: v })} />
              </>
            )}
            <details className="assumptions">
              <summary>
                {d.roi.assumptions} <Icon name="chevron" size={16} />
              </summary>
              <ul>
                {d.roi.assumptionList[tab].map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </details>
          </div>
          <div className="roi-result" aria-live="polite">
            <p className="roi-total-label">{d.roi.out.total}</p>
            <p className="roi-total tabular">{eur(lang, res.total)}</p>
            <div className="roi-bar" aria-hidden="true">
              <span className="roi-bar-a" style={{ width: `${otherShare * 100}%` }} />
              <span className="roi-bar-b" style={{ width: `${(1 - otherShare) * 100}%` }} />
            </div>
            <dl className="roi-rows">
              <div>
                <dt>
                  <i className="key key-a" /> {tab === 'forwarder' ? d.roi.out.purchase : d.roi.out.km}
                </dt>
                <dd className="tabular">
                  {eur(lang, other)}
                  {tab === 'carrier' && <small>{t(d.roi.out.kmDetail, { km: num(lang, c.kmPerYear), perTruck: eur(lang, c.perTruck) })}</small>}
                </dd>
              </div>
              <div>
                <dt>
                  <i className="key key-b" /> {d.roi.out.timeValue}
                </dt>
                <dd className="tabular">{eur(lang, res.valuePerYear)}</dd>
              </div>
              <div>
                <dt>{d.roi.out.hours}</dt>
                <dd className="tabular">
                  {hoursLabel(res.hoursPerMonth)}
                  <small>{t(d.roi.out.fte, { fte: num(lang, res.fte, 1) })}</small>
                </dd>
              </div>
            </dl>
            <p className="roi-note">{d.roi.note}</p>
            <p className="roi-price">{d.roi.price}</p>
            <a href="#termin" className="btn btn-primary">
              {d.roi.cta}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
