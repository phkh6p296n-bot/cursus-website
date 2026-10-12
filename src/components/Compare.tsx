import { useState } from 'react';
import { useI18n } from '../i18n';
import { Icon } from './Icon';

export function Compare() {
  const { d } = useI18n();
  const [mode, setMode] = useState<'today' | 'cursus'>('today');
  const steps = mode === 'today' ? d.compare.todaySteps : d.compare.cursusSteps;
  return (
    <section className="section section-white" id="vergleich">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">{d.compare.eyebrow}</p>
          <h2>{d.compare.title}</h2>
        </div>
        <div className="segmented" role="tablist" aria-label={d.compare.eyebrow}>
          <button type="button" role="tab" aria-selected={mode === 'today'} className={mode === 'today' ? 'is-active' : ''} onClick={() => setMode('today')}>
            {d.compare.today}
          </button>
          <button type="button" role="tab" aria-selected={mode === 'cursus'} className={mode === 'cursus' ? 'is-active' : ''} onClick={() => setMode('cursus')}>
            {d.compare.withCursus}
          </button>
        </div>
        <div className={`compare is-${mode}`} key={mode}>
          <div className="compare-desk" aria-hidden="true">
            {mode === 'today' ? (
              <>
                <p className="desk-label">{d.compare.toolsLabel}</p>
                <div className="tool-pile">
                  {d.compare.tools.map((tool, i) => (
                    <span className="tool" key={tool} style={{ '--i': i } as React.CSSProperties}>
                      {tool}
                      {i % 3 === 0 && <span className="tool-badge">{(i % 4) + 1}</span>}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="desk-label">{d.compare.oneScreen}</p>
                <div className="one-screen">
                  <div className="one-screen-bar" />
                  <div className="one-screen-row is-best" />
                  <div className="one-screen-row" />
                  <div className="one-screen-row" />
                  <div className="one-screen-row is-faint" />
                </div>
              </>
            )}
          </div>
          <div className="compare-timeline">
            <ol className="timeline">
              {steps.map((s, i) => (
                <li key={i} style={{ '--i': i } as React.CSSProperties}>
                  <time>{s.t}</time>
                  <p>{s.text}</p>
                </li>
              ))}
            </ol>
            <p className={`compare-summary ${mode === 'today' ? 'is-bad' : 'is-good'}`}>
              <Icon name={mode === 'today' ? 'alert' : 'check'} size={18} />
              {mode === 'today' ? d.compare.todaySummary : d.compare.cursusSummary}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
