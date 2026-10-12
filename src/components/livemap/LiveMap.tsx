import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n';
import { useInView } from '../../hooks/useInView';
import { Icon } from '../Icon';
import { AlertsScene } from './AlertsScene';
import { DecideScene } from './DecideScene';
import { FleetScene } from './FleetScene';

const CHAPTERS = ['decide', 'search', 'fleet', 'alerts'] as const;
type Chapter = (typeof CHAPTERS)[number];

export function LiveMap() {
  const { d, t } = useI18n();
  const [ref, inView] = useInView<HTMLElement>('-80px');
  const [chapter, setChapter] = useState<Chapter>('decide');
  const idx = CHAPTERS.indexOf(chapter);
  const c = d.map.chapters[chapter];

  // Deep links like #live-karte-fleet open a scene directly.
  useEffect(() => {
    const h = location.hash.replace('#live-karte-', '');
    if ((CHAPTERS as readonly string[]).includes(h)) setChapter(h as Chapter);
  }, []);

  return (
    <section className="section section-ink" id="live-karte" ref={ref}>
      <div className="container">
        <div className="section-head on-dark">
          <p className="eyebrow">{d.map.eyebrow}</p>
          <h2>{d.map.title}</h2>
          <p className="section-lead">{d.map.lead}</p>
        </div>
        <div className="chapters" role="tablist" aria-label={d.map.eyebrow}>
          {CHAPTERS.map((ch, i) => (
            <button
              key={ch}
              type="button"
              role="tab"
              id={`tab-${ch}`}
              aria-selected={chapter === ch}
              aria-controls="scene-panel"
              className={chapter === ch ? 'is-active' : ''}
              onClick={() => setChapter(ch)}
            >
              <span className="chapter-n">{i + 1}</span>
              {d.map.chapters[ch].tab}
            </button>
          ))}
        </div>
        <div className="stage" id="scene-panel" role="tabpanel" aria-labelledby={`tab-${chapter}`}>
          <div className="stage-head">
            <div>
              <p className="stage-scene">{t(d.map.scene, { n: idx + 1 })}</p>
              <h3>{c.title}</h3>
              <p className="stage-hint">{c.hint}</p>
            </div>
            {idx < CHAPTERS.length - 1 && (
              <button type="button" className="btn btn-ghost-dark btn-sm" onClick={() => setChapter(CHAPTERS[idx + 1])}>
                {d.map.next} <Icon name="arrow" size={16} />
              </button>
            )}
          </div>
          {chapter === 'decide' && <DecideScene key="decide" mode="decide" active={inView} />}
          {chapter === 'search' && <DecideScene key="search" mode="search" active={inView} />}
          {chapter === 'fleet' && <FleetScene active={inView} />}
          {chapter === 'alerts' && <AlertsScene active={inView} />}
        </div>
      </div>
    </section>
  );
}
