import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { de, type Dict } from './de';
import { en } from './en';
import type { Lang } from '../lib/format';

const DICTS: Record<Lang, Dict> = { de, en };
const STORAGE_KEY = 'cursus-lang';

type Vars = Record<string, string | number>;

interface I18n {
  lang: Lang;
  setLang: (l: Lang) => void;
  d: Dict;
  t: (template: string, vars?: Vars) => string;
}

const Ctx = createContext<I18n | null>(null);

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'de' || saved === 'en') return saved;
  } catch {
    /* storage can be blocked; fall back to the browser language */
  }
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'de';
  return nav.toLowerCase().startsWith('de') ? 'de' : 'en';
}

/** Fills {placeholders} in a dictionary string. */
export function fill(template: string, vars?: Vars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const value = useMemo<I18n>(
    () => ({
      lang,
      d: DICTS[lang],
      t: fill,
      setLang: (l) => {
        setLangState(l);
        try {
          localStorage.setItem(STORAGE_KEY, l);
        } catch {
          /* ignore */
        }
      },
    }),
    [lang],
  );
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = DICTS[lang].meta.title;
  }, [lang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useI18n outside I18nProvider');
  return v;
}
